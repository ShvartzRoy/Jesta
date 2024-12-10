from ninja import NinjaAPI
from users.api import router as users_router
from services.api import router as services_router

api = NinjaAPI()

api.add_router("/users/", users_router)
api.add_router("/services/", services_router)

