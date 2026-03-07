from rest_framework import serializers
from .models import User


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


# ── MongoDB serializers (mongoengine → plain dict) ────────

def serialize_product(p):
    return {
        'id':          str(p.id),
        'name':        p.name,
        'description': p.description,
        'price':       str(p.price),
        'stock':       p.stock,
        'category':    p.category,
        'image_url':   p.image_url or '',
        'created_at':  p.created_at.isoformat() if p.created_at else None,
    }


def serialize_order_item(i):
    return {
        'product_id':        i.product_id,
        'product_name':      i.product_name,
        'product_image':     i.product_image or '',
        'quantity':          i.quantity,
        'price_at_purchase': str(i.price_at_purchase),
    }


def serialize_order(o):
    return {
        'id':               str(o.id),
        'user_id':          o.user_id,
        'user_name':        o.user_name,
        'user_email':       o.user_email,
        'items':            [serialize_order_item(i) for i in o.items],
        'total_price':      str(o.total_price),
        'status':           o.status,
        'shipping_address': o.shipping_address or '',
        'notes':            o.notes or '',
        'created_at':       o.created_at.isoformat() if o.created_at else None,
    }


class CreateOrderSerializer(serializers.Serializer):
    items            = serializers.ListField(child=serializers.DictField())
    shipping_address = serializers.CharField(required=False, allow_blank=True)
    notes            = serializers.CharField(required=False, allow_blank=True)