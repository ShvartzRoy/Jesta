# jestaApi/asgi.py

import os
from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application
from channels.auth import AuthMiddlewareStack
import chat.routing  # 👈 make sure this file exists!

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'jestaApi.settings')

application = ProtocolTypeRouter({
    "http": get_asgi_application(),  # regular Django views/APIs
    "websocket": AuthMiddlewareStack(
        URLRouter(
            chat.routing.websocket_urlpatterns  # 👈 this handles WebSockets
        )
    ),
})
