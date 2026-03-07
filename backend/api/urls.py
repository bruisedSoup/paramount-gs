from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    # Auth endpoints
    path('auth/register/', views.RegisterView.as_view()),
    path('auth/login/',    views.LoginView.as_view()),
    path('auth/logout/',   views.LogoutView.as_view()),
    path('auth/refresh/',  TokenRefreshView.as_view()),
    path('auth/profile/',  views.ProfileView.as_view()),

    # Product endpoints
    path('products/',      views.ProductListView.as_view()),
    path('products/<int:pk>/', views.ProductDetailView.as_view()),

    # Order endpoints
    path('orders/',        views.OrderListCreateView.as_view()),
    path('orders/<int:pk>/', views.OrderDetailView.as_view()),

    # Admin dashboard
    path('admin/dashboard/', views.DashboardView.as_view()),
]