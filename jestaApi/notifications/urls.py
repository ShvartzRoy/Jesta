# main/api.py
from ninja import NinjaAPI
from notifications.api import router as notifications_router

api = NinjaAPI()
api.add_router("/notifications/", notifications_router)
