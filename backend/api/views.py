from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .models import User
from .mongo_models import Product, Order, OrderItem
from .serializers import (
    RegisterSerializer, UserSerializer,
    CreateOrderSerializer,
    serialize_product, serialize_order,
)
import cloudinary
import cloudinary.uploader
from decouple import config

cloudinary.config(
    cloud_name=config('CLOUDINARY_CLOUD_NAME', default=''),
    api_key=config('CLOUDINARY_API_KEY', default=''),
    api_secret=config('CLOUDINARY_API_SECRET', default=''),
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
            user    = s.save()
            refresh = RefreshToken.for_user(user)
            return Response({
                'user':   UserSerializer(user).data,
                'tokens': {'access': str(refresh.access_token), 'refresh': str(refresh)}
            }, status=status.HTTP_201_CREATED)
        return Response(s.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email    = request.data.get('email', '')
        password = request.data.get('password', '')
        user     = authenticate(request, email=email, password=password)
        if not user:
            return Response({'detail': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
        refresh = RefreshToken.for_user(user)
        return Response({
            'user':   UserSerializer(user).data,
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


class ProfileView(APIView):
    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        s = UserSerializer(request.user, data=request.data, partial=True)
        if s.is_valid():
            s.save()
            return Response(s.data)
        return Response(s.errors, status=status.HTTP_400_BAD_REQUEST)


# ── Products (MongoDB) ────────────────────────────────────

class ProductListView(APIView):
    parser_classes = [MultiPartParser, FormParser]

    def get_permissions(self):
        if self.request.method == 'GET': return [permissions.AllowAny()]
        return [IsAdminUser()]

    def get(self, request):
        qs       = Product.objects.all()
        category = request.query_params.get('category')
        search   = request.query_params.get('search')
        if category: qs = qs.filter(category=category)
        if search:   qs = qs.filter(name__icontains=search)
        return Response([serialize_product(p) for p in qs])

    def post(self, request):
        data      = request.data
        image_url = ''
        if 'image' in request.FILES:
            try:
                result    = cloudinary.uploader.upload(request.FILES['image'])
                image_url = result.get('secure_url', '')
            except Exception as e:
                return Response({'detail': f'Image upload failed: {str(e)}'}, status=400)
        try:
            product = Product(
                name        = data.get('name', ''),
                description = data.get('description', ''),
                price       = float(data.get('price', 0)),
                stock       = int(data.get('stock', 0)),
                category    = data.get('category', 'other'),
                image_url   = image_url,
            )
            product.save()
            return Response(serialize_product(product), status=201)
        except Exception as e:
            return Response({'detail': str(e)}, status=400)


class ProductDetailView(APIView):
    parser_classes = [MultiPartParser, FormParser]

    def get_permissions(self):
        if self.request.method == 'GET': return [permissions.AllowAny()]
        return [IsAdminUser()]

    def get_object(self, pk):
        try:
            return Product.objects.get(id=pk)
        except Exception:
            return None

    def get(self, request, pk):
        p = self.get_object(pk)
        if not p: return Response({'detail': 'Not found'}, status=404)
        return Response(serialize_product(p))

    def patch(self, request, pk):
        p = self.get_object(pk)
        if not p: return Response({'detail': 'Not found'}, status=404)
        data = request.data
        if 'name'        in data: p.name        = data['name']
        if 'description' in data: p.description = data['description']
        if 'price'       in data: p.price       = float(data['price'])
        if 'stock'       in data: p.stock       = int(data['stock'])
        if 'category'    in data: p.category    = data['category']
        if 'image' in request.FILES:
            try:
                result    = cloudinary.uploader.upload(request.FILES['image'])
                p.image_url = result.get('secure_url', '')
            except Exception as e:
                return Response({'detail': f'Image upload failed: {str(e)}'}, status=400)
        p.save()
        return Response(serialize_product(p))

    def delete(self, request, pk):
        p = self.get_object(pk)
        if not p: return Response({'detail': 'Not found'}, status=404)
        p.delete()
        return Response(status=204)


# ── Orders (MongoDB) ──────────────────────────────────────

class OrderListCreateView(APIView):

    def get(self, request):
        if request.user.role == 'admin':
            orders = Order.objects.all()
        else:
            orders = Order.objects.filter(user_id=request.user.id)
        return Response([serialize_order(o) for o in orders])

    def post(self, request):
        s = CreateOrderSerializer(data=request.data)
        if not s.is_valid():
            return Response(s.errors, status=400)

        items_data  = s.validated_data['items']
        total       = 0
        order_items = []

        for item in items_data:
            try:
                product = Product.objects.get(id=item['product_id'])
            except Exception:
                return Response({'detail': 'Product not found'}, status=404)

            qty = int(item.get('quantity', 1))
            if product.stock < qty:
                return Response({'detail': f'Insufficient stock for {product.name}'}, status=400)

            total += float(product.price) * qty
            order_items.append(OrderItem(
                product_id        = str(product.id),
                product_name      = product.name,
                product_image     = product.image_url or '',
                quantity          = qty,
                price_at_purchase = product.price,
            ))

        order = Order(
            user_id          = request.user.id,
            user_name        = request.user.name,
            user_email       = request.user.email,
            items            = order_items,
            total_price      = total,
            shipping_address = s.validated_data.get('shipping_address', ''),
            notes            = s.validated_data.get('notes', ''),
        )
        order.save()

        for item in items_data:
            p = Product.objects.get(id=item['product_id'])
            p.stock -= int(item.get('quantity', 1))
            p.save()

        return Response(serialize_order(order), status=201)


class OrderDetailView(APIView):

    def get_order(self, pk, user):
        try:
            order = Order.objects.get(id=pk)
            if user.role != 'admin' and order.user_id != user.id:
                return None
            return order
        except Exception:
            return None

    def get(self, request, pk):
        order = self.get_order(pk, request.user)
        if not order: return Response({'detail': 'Not found'}, status=404)
        return Response(serialize_order(order))

    def patch(self, request, pk):
        if request.user.role != 'admin':
            return Response({'detail': 'Admin only'}, status=403)
        try:
            order = Order.objects.get(id=pk)
        except Exception:
            return Response({'detail': 'Not found'}, status=404)
        new_status = request.data.get('status')
        valid = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']
        if new_status not in valid:
            return Response({'detail': 'Invalid status'}, status=400)
        order.status = new_status
        order.save()
        return Response(serialize_order(order))


# ── Admin Dashboard ───────────────────────────────────────

class DashboardView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        total_sales = sum(
            float(o.total_price)
            for o in Order.objects.filter(status__in=['delivered', 'confirmed'])
        )
        recent_orders = list(Order.objects.order_by('-created_at')[:5])
        return Response({
            'total_products':  Product.objects.count(),
            'total_orders':    Order.objects.count(),
            'total_sales':     float(total_sales),
            'total_customers': User.objects.filter(role='customer').count(),
            'recent_orders':   [serialize_order(o) for o in recent_orders],
        })