from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.http import HttpResponse
from datetime import datetime
from .models import User
from .mongo_models import Product, Order, OrderItem, Review, ReviewReply, ProductUpdate, UpdateComment
from .serializers import (
    RegisterSerializer, UserSerializer,
    CreateOrderSerializer, CreateReviewSerializer, EditReviewSerializer,
    CreateProductUpdateSerializer,
    serialize_product, serialize_order, serialize_review, serialize_product_update,
)
import cloudinary
import cloudinary.uploader
from decouple import config
import csv
import io

cloudinary.config(
    cloud_name=config('CLOUDINARY_CLOUD_NAME', default=''),
    api_key=config('CLOUDINARY_API_KEY', default=''),
    api_secret=config('CLOUDINARY_API_SECRET', default=''),
)


def _mutable_data(request_data):
    if hasattr(request_data, 'dict'):
        return request_data.dict()
    return dict(request_data)


class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'


# ── TEMPORARY: One-time admin setup ──────────────────────
class SetupAdminView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        import os
        secret       = request.data.get('secret', '')
        setup_secret = os.getenv('SETUP_SECRET', '')

        if not setup_secret:
            return Response(
                {'detail': 'SETUP_SECRET env var not set on server.'},
                status=status.HTTP_403_FORBIDDEN
            )
        if secret != setup_secret:
            return Response(
                {'detail': 'Invalid secret.'},
                status=status.HTTP_403_FORBIDDEN
            )

        email    = request.data.get('email', '').strip().lower()
        password = request.data.get('password', '')
        name     = request.data.get('name', 'Admin')

        if not email or not password:
            return Response(
                {'detail': 'email and password are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if User.objects.filter(email=email).exists():
            return Response(
                {'detail': f'User {email} already exists — you can log in now.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            user    = User.objects.create_superuser(email=email, name=name, password=password)
            refresh = RefreshToken.for_user(user)
            return Response({
                'detail': 'Admin created! Now remove setup-admin from urls.py and redeploy.',
                'user':   UserSerializer(user).data,
                'tokens': {
                    'access':  str(refresh.access_token),
                    'refresh': str(refresh),
                }
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response(
                {'detail': f'Failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# ── Auth ──────────────────────────────────────────────────

class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        s = RegisterSerializer(data=request.data)
        if not s.is_valid():
            return Response(s.errors, status=status.HTTP_400_BAD_REQUEST)
        try:
            user    = s.save()
            refresh = RefreshToken.for_user(user)
            return Response({
                'user':   UserSerializer(user).data,
                'tokens': {
                    'access':  str(refresh.access_token),
                    'refresh': str(refresh),
                }
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            import traceback; traceback.print_exc()
            return Response(
                {'detail': f'Registration failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email    = request.data.get('email', '').strip().lower()
        password = request.data.get('password', '')

        if not email or not password:
            return Response(
                {'detail': 'Email and password are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            user = authenticate(request, email=email, password=password)
            if not user:
                return Response(
                    {'detail': 'Invalid credentials. Please check your email and password.'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            if not user.is_active:
                return Response(
                    {'detail': 'This account has been deactivated.'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            refresh = RefreshToken.for_user(user)
            return Response({
                'user':   UserSerializer(user).data,
                'tokens': {
                    'access':  str(refresh.access_token),
                    'refresh': str(refresh),
                }
            })
        except Exception as e:
            import traceback; traceback.print_exc()
            return Response(
                {'detail': f'Login error: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class LogoutView(APIView):
    def post(self, request):
        try:
            token = RefreshToken(request.data.get('refresh', ''))
            token.blacklist()
            return Response({'detail': 'Logged out successfully.'})
        except Exception:
            return Response({'detail': 'Logged out (token may already be expired).'})


class ProfileView(APIView):
    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        s = UserSerializer(request.user, data=request.data, partial=True)
        if s.is_valid():
            s.save()
            return Response(s.data)
        return Response(s.errors, status=status.HTTP_400_BAD_REQUEST)


# ── Products ──────────────────────────────────────────────

class ProductListView(APIView):
    parser_classes = [MultiPartParser, FormParser]

    def get_permissions(self):
        if self.request.method == 'GET': return [permissions.AllowAny()]
        return [IsAdminUser()]

    def get(self, request):
        qs = Product.objects.all()

        category = request.query_params.get('category')
        search   = request.query_params.get('search')
        if category:
            qs = qs.filter(category=category)
        if search:
            qs = qs.filter(name__icontains=search)

        # ── Pagination ────────────────────────────────────────
        # page_size defaults to 20; page defaults to 1.
        # Callers that want ALL products (e.g. admin list) can pass
        # page_size=0 or a very large value.
        try:
            page_size = int(request.query_params.get('page_size', 20))
        except (ValueError, TypeError):
            page_size = 20

        # page_size=0 means "no limit" — used by admin panels
        if page_size <= 0:
            return Response({
                'results': [serialize_product(p) for p in qs],
                'count':   qs.count(),
                'next':    None,
                'previous': None,
            })

        try:
            page = max(1, int(request.query_params.get('page', 1)))
        except (ValueError, TypeError):
            page = 1

        total   = qs.count()
        offset  = (page - 1) * page_size
        items   = list(qs.skip(offset).limit(page_size))

        has_next     = (offset + page_size) < total
        has_previous = page > 1

        return Response({
            'results':  [serialize_product(p) for p in items],
            'count':    total,
            'next':     page + 1 if has_next     else None,
            'previous': page - 1 if has_previous else None,
        })

    def post(self, request):
        data      = request.data
        image_url = ''
        if 'image' in request.FILES:
            try:
                result    = cloudinary.uploader.upload(request.FILES['image'])
                image_url = result.get('secure_url', '')
            except Exception as e:
                print(f"Image upload warning: {e}")
        try:
            product = Product(
                name        = data.get('name', ''),
                description = data.get('description', ''),
                price       = float(data.get('price', 0)),
                stock       = int(data.get('stock', 0)),
                category    = data.get('category', 'other'),
                image_url   = image_url,
            )
            product.validate()
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
        try:    return Product.objects.get(id=pk)
        except: return None

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
                result      = cloudinary.uploader.upload(request.FILES['image'])
                p.image_url = result.get('secure_url', '')
            except Exception as e:
                print(f"Image upload warning: {e}")
        p.save()
        return Response(serialize_product(p))

    def delete(self, request, pk):
        p = self.get_object(pk)
        if not p: return Response({'detail': 'Not found'}, status=404)
        p.delete()
        return Response(status=204)


# ── Orders ────────────────────────────────────────────────

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
            try:    product = Product.objects.get(id=item['product_id'])
            except: return Response({'detail': 'Product not found'}, status=404)

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
        except:
            return None

    def get(self, request, pk):
        order = self.get_order(pk, request.user)
        if not order: return Response({'detail': 'Not found'}, status=404)
        return Response(serialize_order(order))

    def patch(self, request, pk):
        try:    order = Order.objects.get(id=pk)
        except: return Response({'detail': 'Not found'}, status=404)

        if request.user.role == 'admin':
            new_status = request.data.get('status')
            valid = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']
            if new_status not in valid:
                return Response({'detail': 'Invalid status'}, status=400)
            order.status = new_status
            order.save()
            return Response(serialize_order(order))

        if order.user_id != request.user.id:
            return Response({'detail': 'Not found'}, status=404)

        action = request.data.get('action')
        if action == 'confirm_received':
            if order.status != 'shipped':
                return Response({'detail': 'Order must be shipped first'}, status=400)
            order.status = 'delivered'
            order.save()
            return Response(serialize_order(order))

        return Response({'detail': 'Invalid action'}, status=400)


# ── Reviews ───────────────────────────────────────────────

class ProductReviewsView(APIView):
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_permissions(self):
        if self.request.method == 'GET': return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get(self, request, product_id):
        reviews = Review.objects.filter(product_id=product_id)
        data    = [serialize_review(r) for r in reviews]
        total   = len(data)
        avg     = round(sum(r['rating'] for r in data) / total, 1) if total else 0
        dist    = {i: 0 for i in range(1, 6)}
        for r in data: dist[r['rating']] += 1
        return Response({'reviews': data, 'total': total, 'average': avg, 'distribution': dist})

    def post(self, request, product_id):
        data = _mutable_data(request.data)
        data['product_id'] = product_id

        s = CreateReviewSerializer(data=data)
        if not s.is_valid():
            return Response(s.errors, status=400)

        d = s.validated_data
        try:    order = Order.objects.get(id=d['order_id'])
        except: return Response({'detail': 'Order not found'}, status=404)
        if order.user_id != request.user.id:
            return Response({'detail': 'Not your order'}, status=403)
        if order.status != 'delivered':
            return Response({'detail': 'Order must be delivered before rating'}, status=400)
        product_ids_in_order = [item.product_id for item in order.items]
        if product_id not in product_ids_in_order:
            return Response({'detail': 'Product not in this order'}, status=400)
        existing = Review.objects.filter(
            product_id=product_id, user_id=request.user.id, order_id=d['order_id']
        ).first()
        if existing:
            return Response({'detail': 'Already reviewed'}, status=400)

        image_urls = []
        for key in ['image_0', 'image_1', 'image_2']:
            if key in request.FILES:
                try:
                    result = cloudinary.uploader.upload(request.FILES[key])
                    image_urls.append(result.get('secure_url', ''))
                except Exception as e:
                    print(f"Review image upload warning: {e}")

        review = Review(
            product_id = product_id,
            user_id    = request.user.id,
            user_name  = request.user.name,
            order_id   = d['order_id'],
            rating     = d['rating'],
            body       = d.get('body', ''),
            image_urls = image_urls,
            edit_count = 0,
            is_edited  = False,
        )
        review.save()
        return Response(serialize_review(review), status=201)


class MyReviewsView(APIView):
    def get(self, request):
        reviews = Review.objects.filter(user_id=request.user.id)
        return Response([serialize_review(r) for r in reviews])


class ReviewDetailView(APIView):
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def patch(self, request, review_id):
        try:    review = Review.objects.get(id=review_id)
        except: return Response({'detail': 'Review not found'}, status=404)
        if review.user_id != request.user.id:
            return Response({'detail': 'Not your review'}, status=403)
        if review.edit_count >= 1:
            return Response({'detail': 'Reviews can only be edited once.'}, status=400)

        s = EditReviewSerializer(data=_mutable_data(request.data))
        if not s.is_valid():
            return Response(s.errors, status=400)

        d = s.validated_data
        if 'rating' in d: review.rating = d['rating']
        if 'body'   in d: review.body   = d['body']

        new_images     = []
        has_new_images = any(f'image_{i}' in request.FILES for i in range(3))
        if has_new_images:
            for key in ['image_0', 'image_1', 'image_2']:
                if key in request.FILES:
                    try:
                        result = cloudinary.uploader.upload(request.FILES[key])
                        new_images.append(result.get('secure_url', ''))
                    except Exception as e:
                        print(f"Review edit image warning: {e}")
            review.image_urls = new_images

        review.edit_count = 1
        review.is_edited  = True
        review.edited_at  = datetime.utcnow()
        review.save()
        return Response(serialize_review(review))


class ReviewReplyView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, review_id):
        try:    review = Review.objects.get(id=review_id)
        except: return Response({'detail': 'Review not found'}, status=404)
        body = request.data.get('body', '').strip()
        if not body:
            return Response({'detail': 'Reply body required'}, status=400)
        review.reply = ReviewReply(body=body, admin_name=request.user.name)
        review.save()
        return Response(serialize_review(review))


# ── Product Updates ───────────────────────────────────────

class ProductUpdatesView(APIView):

    def get_permissions(self):
        if self.request.method == 'GET': return [permissions.AllowAny()]
        return [IsAdminUser()]

    def get(self, request, product_id):
        updates = ProductUpdate.objects.filter(product_id=product_id)
        return Response([serialize_product_update(u) for u in updates])

    def post(self, request, product_id):
        s = CreateProductUpdateSerializer(data=request.data)
        if not s.is_valid():
            return Response(s.errors, status=400)
        update = ProductUpdate(
            product_id = product_id,
            admin_name = request.user.name,
            title      = s.validated_data['title'],
            body       = s.validated_data['body'],
        )
        update.save()
        return Response(serialize_product_update(update), status=201)


class ProductUpdateCommentView(APIView):

    def post(self, request, update_id):
        try:    update = ProductUpdate.objects.get(id=update_id)
        except: return Response({'detail': 'Update not found'}, status=404)
        body = request.data.get('body', '').strip()
        if not body:
            return Response({'detail': 'Comment body required'}, status=400)
        update.comments.append(UpdateComment(
            user_id   = request.user.id,
            user_name = request.user.name,
            body      = body,
        ))
        update.save()
        return Response(serialize_product_update(update))


# ── Admin Dashboard ───────────────────────────────────────

class DashboardView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        total_sales = sum(
            float(o.total_price)
            for o in Order.objects.filter(status__in=['delivered', 'confirmed'])
        )
        recent_orders = list(Order.objects.order_by('-created_at')[:5])

        orders   = Order.objects.all()
        products = Product.objects.all()

        orders_by_status = {}
        for o in orders:
            orders_by_status[o.status] = orders_by_status.get(o.status, 0) + 1

        products_by_category = {}
        for p in products:
            products_by_category[p.category] = products_by_category.get(p.category, 0) + 1

        orders_by_product_category = {}
        for order in orders:
            for item in order.items:
                try:
                    product  = Product.objects.get(id=item.product_id)
                    category = product.category
                    orders_by_product_category[category] = orders_by_product_category.get(category, 0) + item.quantity
                except:
                    pass

        sales_by_category = {}
        for order in orders:
            for item in order.items:
                try:
                    product  = Product.objects.get(id=item.product_id)
                    category = product.category
                    sales_by_category[category] = sales_by_category.get(category, 0) + float(item.price_at_purchase) * item.quantity
                except:
                    pass

        return Response({
            'total_products':             products.count(),
            'total_orders':               orders.count(),
            'total_sales':                float(total_sales),
            'total_customers':            User.objects.filter(role='customer').count(),
            'recent_orders':              [serialize_order(o) for o in recent_orders],
            'orders_by_status':           orders_by_status,
            'products_by_category':       products_by_category,
            'orders_by_product_category': orders_by_product_category,
            'sales_by_category':          {k: float(v) for k, v in sales_by_category.items()},
        })


# ── Report Download ───────────────────────────────────────

class ReportDownloadView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        report_type = request.query_params.get('type', 'products')  # 'products' | 'orders'
        file_format = request.query_params.get('format', 'csv')     # 'csv' | 'pdf'

        if report_type == 'products':
            return self._products_report(file_format)
        elif report_type == 'orders':
            return self._orders_report(file_format)
        else:
            return Response({'detail': 'Invalid report type. Use products or orders.'}, status=400)

    # ── Products ───────────────────────────────────────────
    def _products_report(self, file_format):
        products = list(Product.objects.all())
        now = datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')
        category_map = {}
        for p in products:
            cat = (p.category or 'other').capitalize()
            if cat not in category_map:
                category_map[cat] = {'count': 0, 'total_stock': 0, 'total_value': 0.0}
            category_map[cat]['count'] += 1
            category_map[cat]['total_stock'] += int(p.stock or 0)
            category_map[cat]['total_value'] += float(p.price or 0) * int(p.stock or 0)
        if file_format == 'csv':
            return self._products_csv(products, category_map, now)
        return self._products_pdf(products, category_map, now)

    def _products_csv(self, products, category_map, now):
        buf = io.StringIO()
        w = csv.writer(buf)
        w.writerow(['PARAMOUNT GS - PRODUCTS SUMMARY REPORT'])
        w.writerow(['Generated:', now])
        w.writerow(['Total Products:', len(products)])
        w.writerow([])
        w.writerow(['CATEGORY SUMMARY'])
        w.writerow(['Category', 'Product Count', 'Total Stock', 'Inventory Value (PHP)'])
        for cat, s in sorted(category_map.items()):
            w.writerow([cat, s['count'], s['total_stock'], f"{s['total_value']:,.2f}"])
        w.writerow([])
        w.writerow(['PRODUCT LIST'])
        w.writerow(['Name', 'Category', 'Price (PHP)', 'Stock', 'Status'])
        for p in sorted(products, key=lambda x: (x.category or '')):
            stock = int(p.stock or 0)
            status = 'In Stock' if stock > 5 else ('Low Stock' if stock > 0 else 'Out of Stock')
            w.writerow([p.name, (p.category or 'other').capitalize(), f"{float(p.price or 0):,.2f}", stock, status])
        resp = HttpResponse(buf.getvalue(), content_type='text/csv')
        resp['Content-Disposition'] = 'attachment; filename="paramount_products_report.csv"'
        return resp

    def _products_pdf(self, products, category_map, now):
        from reportlab.lib.pagesizes import A4
        from reportlab.lib import colors
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import cm
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
        from reportlab.lib.enums import TA_LEFT
        buf = io.BytesIO()
        doc = SimpleDocTemplate(buf, pagesize=A4, leftMargin=2*cm, rightMargin=2*cm, topMargin=2*cm, bottomMargin=2*cm)
        styles = getSampleStyleSheet()
        BLUE = colors.HexColor('#0066cc')
        GREY = colors.HexColor('#f5f5f7')
        DARK = colors.HexColor('#111111')
        title_s   = ParagraphStyle('t', parent=styles['Title'],   textColor=BLUE, fontSize=22, spaceAfter=4, alignment=TA_LEFT)
        sub_s     = ParagraphStyle('s', parent=styles['Normal'],  textColor=colors.HexColor('#6e6e73'), fontSize=10, spaceAfter=2)
        section_s = ParagraphStyle('h', parent=styles['Heading2'],textColor=DARK, fontSize=13, spaceBefore=14, spaceAfter=6)
        story = []
        story.append(Paragraph('Paramount GS', title_s))
        story.append(Paragraph('Products Summary Report', section_s))
        story.append(Paragraph(f'Generated: {now}  |  Total Products: {len(products)}', sub_s))
        story.append(Spacer(1, 0.4*cm))
        story.append(Paragraph('Category Breakdown', section_s))
        cat_data = [['Category', 'Products', 'Total Stock', 'Inventory Value (PHP)']]
        for cat, s in sorted(category_map.items()):
            cat_data.append([cat, str(s['count']), str(s['total_stock']), f"{s['total_value']:,.2f}"])
        ct = Table(cat_data, colWidths=[4.5*cm, 3*cm, 3.5*cm, 5.5*cm])
        ct.setStyle(TableStyle([
            ('BACKGROUND', (0,0),(-1,0), BLUE), ('TEXTCOLOR', (0,0),(-1,0), colors.white),
            ('FONTNAME', (0,0),(-1,0), 'Helvetica-Bold'), ('FONTSIZE', (0,0),(-1,-1), 9),
            ('ROWBACKGROUNDS', (0,1),(-1,-1), [colors.white, GREY]),
            ('GRID', (0,0),(-1,-1), 0.4, colors.HexColor('#d2d2d7')),
            ('LEFTPADDING',(0,0),(-1,-1),8),('RIGHTPADDING',(0,0),(-1,-1),8),
            ('TOPPADDING',(0,0),(-1,-1),6),('BOTTOMPADDING',(0,0),(-1,-1),6),
            ('ALIGN',(1,0),(-1,-1),'CENTER'),
        ]))
        story.append(ct)
        story.append(Spacer(1, 0.5*cm))
        story.append(Paragraph('Product List', section_s))
        prod_data = [['Product Name', 'Category', 'Price (PHP)', 'Stock', 'Status']]
        for p in sorted(products, key=lambda x: (x.category or '')):
            stock = int(p.stock or 0)
            st = 'In Stock' if stock > 5 else ('Low Stock' if stock > 0 else 'Out of Stock')
            prod_data.append([p.name, (p.category or 'other').capitalize(), f"{float(p.price or 0):,.2f}", str(stock), st])
        pt = Table(prod_data, colWidths=[5.5*cm, 3.2*cm, 3.2*cm, 2*cm, 2.6*cm])
        pt.setStyle(TableStyle([
            ('BACKGROUND', (0,0),(-1,0), BLUE), ('TEXTCOLOR', (0,0),(-1,0), colors.white),
            ('FONTNAME', (0,0),(-1,0), 'Helvetica-Bold'), ('FONTSIZE', (0,0),(-1,-1), 8),
            ('ROWBACKGROUNDS', (0,1),(-1,-1), [colors.white, GREY]),
            ('GRID', (0,0),(-1,-1), 0.4, colors.HexColor('#d2d2d7')),
            ('LEFTPADDING',(0,0),(-1,-1),6),('RIGHTPADDING',(0,0),(-1,-1),6),
            ('TOPPADDING',(0,0),(-1,-1),5),('BOTTOMPADDING',(0,0),(-1,-1),5),
        ]))
        story.append(pt)
        doc.build(story)
        buf.seek(0)
        resp = HttpResponse(buf.read(), content_type='application/pdf')
        resp['Content-Disposition'] = 'attachment; filename="paramount_products_report.pdf"'
        return resp

    # ── Orders ────────────────────────────────────────────
    def _orders_report(self, file_format):
        orders = list(Order.objects.all())
        now = datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')
        total_revenue     = sum(float(o.total_price) for o in orders)
        delivered_revenue = sum(float(o.total_price) for o in orders if o.status == 'delivered')
        status_map = {}
        for o in orders:
            s = o.status or 'pending'
            status_map[s] = status_map.get(s, 0) + 1
        if file_format == 'csv':
            return self._orders_csv(orders, status_map, total_revenue, delivered_revenue, now)
        return self._orders_pdf(orders, status_map, total_revenue, delivered_revenue, now)

    def _orders_csv(self, orders, status_map, total_revenue, delivered_revenue, now):
        buf = io.StringIO()
        w = csv.writer(buf)
        w.writerow(['PARAMOUNT GS - ORDERS SUMMARY REPORT'])
        w.writerow(['Generated:', now])
        w.writerow(['Total Orders:', len(orders)])
        w.writerow(['Total Revenue (PHP):', f'{total_revenue:,.2f}'])
        w.writerow(['Delivered Revenue (PHP):', f'{delivered_revenue:,.2f}'])
        w.writerow([])
        w.writerow(['STATUS BREAKDOWN'])
        w.writerow(['Status', 'Count'])
        for s, c in sorted(status_map.items()):
            w.writerow([s.capitalize(), c])
        w.writerow([])
        w.writerow(['ORDER LIST'])
        w.writerow(['Order ID', 'Customer', 'Email', 'Items', 'Total (PHP)', 'Status', 'Date'])
        for o in sorted(orders, key=lambda x: str(x.created_at or ''), reverse=True):
            w.writerow([
                str(o.id)[-8:].upper(), o.user_name, o.user_email,
                sum(item.quantity for item in o.items),
                f'{float(o.total_price):,.2f}',
                (o.status or 'pending').capitalize(),
                str(o.created_at)[:10] if o.created_at else '',
            ])
        resp = HttpResponse(buf.getvalue(), content_type='text/csv')
        resp['Content-Disposition'] = 'attachment; filename="paramount_orders_report.csv"'
        return resp

    def _orders_pdf(self, orders, status_map, total_revenue, delivered_revenue, now):
        from reportlab.lib.pagesizes import A4
        from reportlab.lib import colors
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import cm
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
        from reportlab.lib.enums import TA_LEFT
        buf = io.BytesIO()
        doc = SimpleDocTemplate(buf, pagesize=A4, leftMargin=2*cm, rightMargin=2*cm, topMargin=2*cm, bottomMargin=2*cm)
        styles = getSampleStyleSheet()
        BLUE = colors.HexColor('#0066cc')
        GREY = colors.HexColor('#f5f5f7')
        DARK = colors.HexColor('#111111')
        title_s   = ParagraphStyle('t', parent=styles['Title'],   textColor=BLUE, fontSize=22, spaceAfter=4, alignment=TA_LEFT)
        sub_s     = ParagraphStyle('s', parent=styles['Normal'],  textColor=colors.HexColor('#6e6e73'), fontSize=10, spaceAfter=2)
        section_s = ParagraphStyle('h', parent=styles['Heading2'],textColor=DARK, fontSize=13, spaceBefore=14, spaceAfter=6)
        story = []
        story.append(Paragraph('Paramount GS', title_s))
        story.append(Paragraph('Orders Summary Report', section_s))
        story.append(Paragraph(
            f'Generated: {now}  |  Total Orders: {len(orders)}  |  '
            f'Total Revenue: PHP {total_revenue:,.2f}  |  Delivered: PHP {delivered_revenue:,.2f}', sub_s))
        story.append(Spacer(1, 0.4*cm))
        story.append(Paragraph('Order Status Breakdown', section_s))
        status_data = [['Status', 'Count']]
        for s, c in sorted(status_map.items()):
            status_data.append([s.capitalize(), str(c)])
        stt = Table(status_data, colWidths=[5*cm, 3*cm])
        stt.setStyle(TableStyle([
            ('BACKGROUND', (0,0),(-1,0), BLUE), ('TEXTCOLOR', (0,0),(-1,0), colors.white),
            ('FONTNAME', (0,0),(-1,0), 'Helvetica-Bold'), ('FONTSIZE', (0,0),(-1,-1), 9),
            ('ROWBACKGROUNDS', (0,1),(-1,-1), [colors.white, GREY]),
            ('GRID', (0,0),(-1,-1), 0.4, colors.HexColor('#d2d2d7')),
            ('LEFTPADDING',(0,0),(-1,-1),8),('RIGHTPADDING',(0,0),(-1,-1),8),
            ('TOPPADDING',(0,0),(-1,-1),6),('BOTTOMPADDING',(0,0),(-1,-1),6),
            ('ALIGN',(1,0),(-1,-1),'CENTER'),
        ]))
        story.append(stt)
        story.append(Spacer(1, 0.5*cm))
        story.append(Paragraph('Order List', section_s))
        order_data = [['Order ID', 'Customer', 'Items', 'Total (PHP)', 'Status', 'Date']]
        for o in sorted(orders, key=lambda x: str(x.created_at or ''), reverse=True):
            order_data.append([
                str(o.id)[-8:].upper(),
                f'{o.user_name} / {o.user_email}',
                str(sum(item.quantity for item in o.items)),
                f'{float(o.total_price):,.2f}',
                (o.status or 'pending').capitalize(),
                str(o.created_at)[:10] if o.created_at else '',
            ])
        ot = Table(order_data, colWidths=[2.2*cm, 5*cm, 1.5*cm, 3*cm, 2.5*cm, 2.3*cm])
        ot.setStyle(TableStyle([
            ('BACKGROUND', (0,0),(-1,0), BLUE), ('TEXTCOLOR', (0,0),(-1,0), colors.white),
            ('FONTNAME', (0,0),(-1,0), 'Helvetica-Bold'), ('FONTSIZE', (0,0),(-1,-1), 7.5),
            ('ROWBACKGROUNDS', (0,1),(-1,-1), [colors.white, GREY]),
            ('GRID', (0,0),(-1,-1), 0.4, colors.HexColor('#d2d2d7')),
            ('LEFTPADDING',(0,0),(-1,-1),5),('RIGHTPADDING',(0,0),(-1,-1),5),
            ('TOPPADDING',(0,0),(-1,-1),4),('BOTTOMPADDING',(0,0),(-1,-1),4),
            ('VALIGN',(0,0),(-1,-1),'MIDDLE'),
        ]))
        story.append(ot)
        doc.build(story)
        buf.seek(0)
        resp = HttpResponse(buf.read(), content_type='application/pdf')
        resp['Content-Disposition'] = 'attachment; filename="paramount_orders_report.pdf"'
        return resp