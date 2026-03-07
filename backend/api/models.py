from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin


# ── Django User (PostgreSQL/SQLite — needed for JWT auth) ─

class UserManager(BaseUserManager):
    def create_user(self, email, name, password=None, role='customer'):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)
        user = self.model(email=email, name=name, role=role)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, name, password=None):
        user = self.create_user(email, name, password, role='admin')
        user.is_staff = True
        user.is_superuser = True
        user.save(using=self._db)
        return user


class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = [('admin', 'Admin'), ('customer', 'Customer')]
    name       = models.CharField(max_length=150)
    email      = models.EmailField(unique=True)
    role       = models.CharField(max_length=10, choices=ROLE_CHOICES, default='customer')
    is_active  = models.BooleanField(default=True)
    is_staff   = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    objects = UserManager()
    USERNAME_FIELD  = 'email'
    REQUIRED_FIELDS = ['name']

    class Meta:
        db_table = 'users'