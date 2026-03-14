from django.apps import AppConfig
import sys


class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'

    def ready(self):
        SKIP_COMMANDS = {
            'makemigrations', 'migrate', 'collectstatic',
            'check', 'shell', 'dbshell', 'test',
            'createsuperuser', 'showmigrations',
        }
        if any(cmd in sys.argv for cmd in SKIP_COMMANDS):
            return
        self._connect_mongo()

    def _connect_mongo(self):
        try:
            import mongoengine
            from django.conf import settings

            uri = getattr(settings, 'MONGODB_URI', '')
            if not uri:
                print('[MongoDB] WARNING: MONGODB_URI not set — skipping.')
                return

            try:
                mongoengine.disconnect_all()
            except Exception:
                pass

            mongoengine.connect(
                db='paramount_db',
                host=uri,
                uuidRepresentation='standard',
                serverSelectionTimeoutMS=10000,
                connectTimeoutMS=10000,
                socketTimeoutMS=20000,
                maxPoolSize=5,
                minPoolSize=0,
                retryWrites=True,
            )
            print('[MongoDB] Connected successfully.')

        except Exception as e:
            import traceback
            print(f'[MongoDB] ERROR: {e}')
            traceback.print_exc()
            print('[MongoDB] Continuing without MongoDB — SQL endpoints still available.')