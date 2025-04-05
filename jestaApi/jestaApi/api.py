from ninja import NinjaAPI
from users.api import router as users_router
from services.api import router as services_router
from reviews.api import router as reviews_router
from specialists.api import router as specialists_router
from tags.api import router as tags_router
from new_badges.api import router as badges_router
from new_ranks.api import router as ranks_router
from chat.api import router as chats_router


api = NinjaAPI()

api.add_router("/users/", users_router)
api.add_router("/services/", services_router)
api.add_router("/reviews/", reviews_router)
api.add_router("/specialists/", specialists_router)
api.add_router("/tags/", tags_router)
api.add_router("/badges/", badges_router)
api.add_router("/ranks/", ranks_router)
api.add_router("/chats/", chats_router)

