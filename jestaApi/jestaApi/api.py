from ninja import NinjaAPI
from users.api import router as users_router
from services.api import router as services_router
from reviews.api import router as reviews_router
from specialists.api import router as specialists_router
from tags.api import router as tags_router

api = NinjaAPI()

api.add_router("/users/", users_router)
api.add_router("/services/", services_router)
api.add_router("/reviews/", reviews_router)
api.add_router("/specialists/", specialists_router)
api.add_router("/tags/", tags_router)

