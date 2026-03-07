from rest_framework import serializers
from .models import User, Product, Order, OrderItem


class RegisterSerializer(serializers.ModelSerializer):
    password         = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model  = User
        fields = ['name', 'email', 'password', 'confirm_password']

    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match'})
        return data

    def create(self, validated_data):
        validated_data.pop('confirm_password')
        return User.objects.create_user(**validated_data)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model  = User
        fields = ['id', 'name', 'email', 'role', 'created_at']


class ProductSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model  = Product
        fields = ['id', 'name', 'description', 'price', 'stock',
                  'category', 'image', 'image_url', 'created_at']
        read_only_fields = ['id', 'created_at', 'image_url']

    def get_image_url(self, obj):
        if obj.image:
            try: return str(obj.image.url)
            except: return None
        return None


class OrderItemSerializer(serializers.ModelSerializer):
    product_name  = serializers.CharField(source='product.name', read_only=True)
    product_image = serializers.SerializerMethodField()

    class Meta:
        model  = OrderItem
        fields = ['id', 'product', 'product_name', 'product_image',
                  'quantity', 'price_at_purchase']

    def get_product_image(self, obj):
        if obj.product and obj.product.image:
            try: return str(obj.product.image.url)
            except: return None
        return None


class OrderSerializer(serializers.ModelSerializer):
    items      = OrderItemSerializer(many=True, read_only=True)
    user_name  = serializers.CharField(source='user.name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model  = Order
        fields = ['id', 'user', 'user_name', 'user_email', 'items',
                  'total_price', 'status', 'shipping_address',
                  'notes', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']


class CreateOrderSerializer(serializers.Serializer):
    items            = serializers.ListField(child=serializers.DictField())
    shipping_address = serializers.CharField(required=False, allow_blank=True)
    notes            = serializers.CharField(required=False, allow_blank=True)