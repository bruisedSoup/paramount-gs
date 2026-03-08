import mongoengine as me
from datetime import datetime

class Product(me.Document):
    CATEGORY_CHOICES = [
        'phones', 'laptops', 'tablets', 'accessories',
        'audio', 'cameras', 'gaming', 'other'
    ]
    name        = me.StringField(required=True, max_length=255)
    description = me.StringField(required=True)
    price       = me.DecimalField(required=True, precision=2)
    stock       = me.IntField(default=0)
    category    = me.StringField(required=True, choices=CATEGORY_CHOICES)
    image_url   = me.StringField(default='')
    created_at  = me.DateTimeField(default=datetime.utcnow)
    updated_at  = me.DateTimeField(default=datetime.utcnow)

    meta = {
        'collection': 'products',
        'ordering':   ['-created_at'],
    }

    def save(self, *args, **kwargs):
        self.updated_at = datetime.utcnow()
        return super().save(*args, **kwargs)


class OrderItem(me.EmbeddedDocument):
    product_id        = me.StringField(required=True)
    product_name      = me.StringField()
    product_image     = me.StringField(default='')
    quantity          = me.IntField(default=1)
    price_at_purchase = me.DecimalField(precision=2)


class Order(me.Document):
    STATUS_CHOICES = (
        'pending', 'confirmed', 'processing',
        'shipped', 'delivered', 'cancelled'
    )
    user_id          = me.IntField(required=True)
    user_name        = me.StringField()
    user_email       = me.StringField()
    items            = me.EmbeddedDocumentListField(OrderItem)
    total_price      = me.DecimalField(precision=2)
    status           = me.StringField(choices=STATUS_CHOICES, default='pending')
    shipping_address = me.StringField(default='')
    notes            = me.StringField(default='')
    created_at       = me.DateTimeField(default=datetime.utcnow)
    updated_at       = me.DateTimeField(default=datetime.utcnow)

    meta = {
        'collection': 'orders',
        'ordering':   ['-created_at'],
    }

    def save(self, *args, **kwargs):
        self.updated_at = datetime.utcnow()
        return super().save(*args, **kwargs)


# ── Review / Rating ───────────────────────────────────────

class ReviewReply(me.EmbeddedDocument):
    """Admin reply to a review"""
    body       = me.StringField(required=True)
    admin_name = me.StringField(default='Admin')
    created_at = me.DateTimeField(default=datetime.utcnow)


class Review(me.Document):
    product_id  = me.StringField(required=True)   # ref to Product.id
    user_id     = me.IntField(required=True)       # ref to PostgreSQL User.id
    user_name   = me.StringField()
    order_id    = me.StringField(required=True)    # must have bought the product
    rating      = me.IntField(required=True, min_value=1, max_value=5)
    body        = me.StringField(default='')
    image_urls = me.ListField(me.StringField(), default=list)
    reply       = me.EmbeddedDocumentField(ReviewReply)
    edit_count  = me.IntField(default=0)   # max 1
    is_edited   = me.BooleanField(default=False)
    edited_at   = me.DateTimeField(default=None)
    created_at  = me.DateTimeField(default=datetime.utcnow)
    updated_at  = me.DateTimeField(default=datetime.utcnow)

    meta = {
        'collection': 'reviews',
        'ordering':   ['-created_at'],
        'indexes':    ['product_id', 'user_id', 'order_id'],
    }

    def save(self, *args, **kwargs):
        self.updated_at = datetime.utcnow()
        return super().save(*args, **kwargs)


# ── Product Updates (admin posts visible to all) ──────────

class UpdateComment(me.EmbeddedDocument):
    user_id    = me.IntField(required=True)
    user_name  = me.StringField()
    body       = me.StringField(required=True)
    created_at = me.DateTimeField(default=datetime.utcnow)


class ProductUpdate(me.Document):
    product_id = me.StringField(required=True)
    admin_name = me.StringField(default='Admin')
    title      = me.StringField(required=True)
    body       = me.StringField(required=True)
    comments   = me.EmbeddedDocumentListField(UpdateComment)
    created_at = me.DateTimeField(default=datetime.utcnow)

    meta = {
        'collection': 'product_updates',
        'ordering':   ['-created_at'],
        'indexes':    ['product_id'],
    }