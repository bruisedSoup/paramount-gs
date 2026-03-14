from django.apps import AppConfig
import sys


class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'

    def ready(self):
        # Skip MongoDB connection during management commands
        SKIP_COMMANDS = {
            'makemigrations', 'migrate', 'collectstatic',
            'check', 'shell', 'dbshell', 'test',
            'createsuperuser', 'showmigrations',
        }
        if any(cmd in sys.argv for cmd in SKIP_COMMANDS):
            return

        # Skip during Gunicorn worker boot prefork phase
        # (only connect when the worker process actually handles requests)
        self._connect_mongo()

    def _connect_mongo(self):
        try:
            import mongoengine
            from django.conf import settings

            uri = getattr(settings, 'MONGODB_URI', '')
            if not uri:
                print('[MongoDB] WARNING: MONGODB_URI is not set — skipping connection.')
                return

            # Disconnect any existing connections first (safe to call repeatedly)
            try:
                mongoengine.disconnect_all()
            except Exception:
                pass

            mongoengine.connect(
                db='paramount_db',
                host=uri,
                uuidRepresentation='standard',
                # Generous timeouts for Render cold-start + Atlas free tier
                serverSelectionTimeoutMS=10000,
                connectTimeoutMS=10000,
                socketTimeoutMS=20000,
                # Keep the pool small on free-tier hosts
                maxPoolSize=5,
                minPoolSize=0,
                # Retry on transient network errors
                retryWrites=True,
            )
            print('[MongoDB] Connection registered successfully.')

        except Exception as e:
            # CRITICAL: never let a MongoDB error crash the Django process.
            # Log it and continue — SQL auth (login/register) will still work.
            # Any view that actually queries MongoDB will fail gracefully.
            import traceback
            print(f'[MongoDB] ERROR during connection setup: {e}')
            traceback.print_exc()
            print('[MongoDB] Continuing without MongoDB — SQL endpoints still available.')