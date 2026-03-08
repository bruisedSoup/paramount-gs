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


def serialize_review_reply(r):
    if not r:
        return None
    return {
        'body':       r.body,
        'admin_name': r.admin_name,
        'created_at': r.created_at.isoformat() if r.created_at else None,
    }


def serialize_review(r):
    return {
        'id':         str(r.id),
        'product_id': r.product_id,
        'user_id':    r.user_id,
        'user_name':  r.user_name,
        'order_id':   r.order_id,
        'rating':     r.rating,
        'body':       r.body or '',
        'image_urls': r.image_urls or [],
        'reply':      serialize_review_reply(r.reply),
        'is_edited':  r.is_edited or False,
        'edit_count': r.edit_count or 0,
        'edited_at':  r.edited_at.isoformat() if r.edited_at else None,
        'created_at': r.created_at.isoformat() if r.created_at else None,
    }


def serialize_update_comment(c):
    return {
        'user_id':    c.user_id,
        'user_name':  c.user_name,
        'body':       c.body,
        'created_at': c.created_at.isoformat() if c.created_at else None,
    }


def serialize_product_update(u):
    return {
        'id':         str(u.id),
        'product_id': u.product_id,
        'admin_name': u.admin_name,
        'title':      u.title,
        'body':       u.body,
        'comments':   [serialize_update_comment(c) for c in u.comments],
        'created_at': u.created_at.isoformat() if u.created_at else None,
    }


class CreateOrderSerializer(serializers.Serializer):
    items            = serializers.ListField(child=serializers.DictField())
    shipping_address = serializers.CharField(required=False, allow_blank=True)
    notes            = serializers.CharField(required=False, allow_blank=True)


class CreateReviewSerializer(serializers.Serializer):
    product_id = serializers.CharField()
    order_id   = serializers.CharField()
    rating     = serializers.IntegerField(min_value=1, max_value=5)
    body       = serializers.CharField(required=False, allow_blank=True)


class EditReviewSerializer(serializers.Serializer):
    rating = serializers.IntegerField(min_value=1, max_value=5, required=False)
    body   = serializers.CharField(required=False, allow_blank=True)


class CreateProductUpdateSerializer(serializers.Serializer):
    title = serializers.CharField()
    body  = serializers.CharField()