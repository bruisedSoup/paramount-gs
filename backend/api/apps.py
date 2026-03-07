from django.apps import AppConfig
import sys

class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'

    def ready(self):
        # Skip MongoDB connection during management commands
        if 'makemigrations' in sys.argv or 'migrate' in sys.argv:
            return
        
        import mongoengine
        from django.conf import settings
        if settings.MONGODB_URI:
            mongoengine.connect(
                db='paramount_db',
                host=settings.MONGODB_URI,
                uuidRepresentation='standard',
                serverSelectionTimeoutMS=5000,
                connectTimeoutMS=5000,
            )