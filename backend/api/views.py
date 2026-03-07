from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.db.models import Sum
from .models import User, Product, Order, OrderItem
from .serializers import (
    RegisterSerializer, UserSerializer, ProductSerializer,
    OrderSerializer, CreateOrderSerializer
)


class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'


# ── Auth ──────────────────────────────────────────────────

class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        s = RegisterSerializer(data=request.data)
        if s.is_valid():
            user = s.save()
            refresh = RefreshToken.for_user(user)
            return Response({
                'user': UserSerializer(user).data,
                'tokens': {'access': str(refresh.access_token), 'refresh': str(refresh)}
            }, status=status.HTTP_201_CREATED)
        return Response(s.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email    = request.data.get('email', '')
        password = request.data.get('password', '')
        user = authenticate(request, email=email, password=password)
        if not user:
            return Response({'detail': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'tokens': {'access': str(refresh.access_token), 'refresh': str(refresh)}
        })


class LogoutView(APIView):
    def post(self, request):
        try:
            token = RefreshToken(request.data['refresh'])
            token.blacklist()
            return Response({'detail': 'Logged out'})
        except Exception:
            return Response({'detail': 'Error'}, status=status.HTTP_400_BAD_REQUEST)


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    def get_object(self): return self.request.user


# ── Products ──────────────────────────────────────────────

class ProductListView(generics.ListCreateAPIView):
    serializer_class = ProductSerializer
    parser_classes   = [MultiPartParser, FormParser]

    def get_permissions(self):
        if self.request.method == 'GET': return [permissions.AllowAny()]
        return [IsAdminUser()]

    def get_queryset(self):
        qs       = Product.objects.all()
        category = self.request.query_params.get('category')
        search   = self.request.query_params.get('search')
        if category: qs = qs.filter(category=category)
        if search:   qs = qs.filter(name__icontains=search)
        return qs


class ProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset         = Product.objects.all()
    serializer_class = ProductSerializer
    parser_classes   = [MultiPartParser, FormParser]

    def get_permissions(self):
        if self.request.method == 'GET': return [permissions.AllowAny()]
        return [IsAdminUser()]


# ── Orders ────────────────────────────────────────────────

class OrderListCreateView(APIView):
    def get(self, request):
        orders = Order.objects.all() if request.user.role == 'admin' \
                 else Order.objects.filter(user=request.user)
        return Response(OrderSerializer(orders, many=True).data)

    def post(self, request):
        s = CreateOrderSerializer(data=request.data)
        if not s.is_valid(): return Response(s.errors, status=status.HTTP_400_BAD_REQUEST)

        items_data, total, order_items = s.validated_data['items'], 0, []

        for item in items_data:
            try:
                product = Product.objects.get(id=item['product_id'])
            except Product.DoesNotExist:
                return Response({'detail': f"Product not found"}, status=status.HTTP_404_NOT_FOUND)
            qty = int(item.get('quantity', 1))
            if product.stock < qty:
                return Response({'detail': f'Insufficient stock for {product.name}'},
                                status=status.HTTP_400_BAD_REQUEST)
            total += product.price * qty
            order_items.append((product, qty))

        order = Order.objects.create(
            user=request.user, total_price=total,
            shipping_address=s.validated_data.get('shipping_address', ''),
            notes=s.validated_data.get('notes', '')
        )
        for product, qty in order_items:
            OrderItem.objects.create(order=order, product=product,
                                      quantity=qty, price_at_purchase=product.price)
            product.stock -= qty
            product.save()

        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)


class OrderDetailView(APIView):
    def get_order(self, pk, user):
        try:
            order = Order.objects.get(pk=pk)
            if user.role != 'admin' and order.user != user:
                return None
            return order
        except Order.DoesNotExist:
            return None

    def get(self, request, pk):
        order = self.get_order(pk, request.user)
        if not order: return Response({'detail': 'Not found'}, status=404)
        return Response(OrderSerializer(order).data)

    def patch(self, request, pk):
        if request.user.role != 'admin':
            return Response({'detail': 'Admin only'}, status=403)
        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            return Response({'detail': 'Not found'}, status=404)
        new_status = request.data.get('status')
        valid = [s[0] for s in Order.STATUS_CHOICES]
        if new_status not in valid:
            return Response({'detail': 'Invalid status'}, status=400)
        order.status = new_status
        order.save()
        return Response(OrderSerializer(order).data)


# ── Admin Dashboard ───────────────────────────────────────

class DashboardView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        total_sales = Order.objects.filter(
            status__in=['delivered', 'confirmed']
        ).aggregate(t=Sum('total_price'))['t'] or 0

        return Response({
            'total_products':  Product.objects.count(),
            'total_orders':    Order.objects.count(),
            'total_sales':     float(total_sales),
            'total_customers': User.objects.filter(role='customer').count(),
            'recent_orders':   OrderSerializer(Order.objects.all()[:5], many=True).data,
        })