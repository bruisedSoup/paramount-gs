from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    # Auth
    path('auth/register/', views.RegisterView.as_view()),
    path('auth/login/',    views.LoginView.as_view()),
    path('auth/logout/',   views.LogoutView.as_view()),
    path('auth/refresh/',  TokenRefreshView.as_view()),
    path('auth/profile/',  views.ProfileView.as_view()),

    # Products
    path('products/',          views.ProductListView.as_view()),
    path('products/<str:pk>/', views.ProductDetailView.as_view()),

    # Orders
    path('orders/',          views.OrderListCreateView.as_view()),
    path('orders/<str:pk>/', views.OrderDetailView.as_view()),

    # Reviews (per product)
    path('products/<str:product_id>/reviews/', views.ProductReviewsView.as_view()),
    path('reviews/<str:review_id>/reply/',     views.ReviewReplyView.as_view()),

    # Product updates & comments
    path('products/<str:product_id>/updates/',          views.ProductUpdatesView.as_view()),
    path('product-updates/<str:update_id>/comments/',   views.ProductUpdateCommentView.as_view()),

    # Admin dashboard
    path('admin/dashboard/', views.DashboardView.as_view()),
]