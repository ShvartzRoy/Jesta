from ninja import NinjaAPI
from ninja.errors import HttpError, ValidationError
from ninja.responses import Response

from users.api import router as users_router
from services.api import router as services_router
from reviews.api import router as reviews_router
from specialists.api import router as specialists_router
from tags.api import router as tags_router
from new_badges.api import router as badges_router
from new_ranks.api import router as ranks_router

api = NinjaAPI()


@api.exception_handler(HttpError)
def custom_http_error_handler(request, exc: HttpError):
    print("HttpError caught:", repr(exc), "args:", exc.args)

    msg = getattr(exc, "detail", None)
    if not msg and len(exc.args) > 1:
        msg = exc.args[1]  
    elif not msg and len(exc.args) == 1:
        msg = exc.args[0]

    msg = msg or "Something went wrong"

    return Response({"msg": str(msg)}, status=exc.status_code)

    
 
@api.exception_handler(ValidationError)
def custom_validation_error_handler(request, exc: ValidationError):
    first_error = exc.errors[0]['msg'] if exc.errors else "Validation failed"
    return Response({"msg": first_error}, status=422)

@api.exception_handler(Exception)
def global_error_handler(request, exc: Exception):
    return Response({"msg": str(exc)}, status=500)


api.add_router("/users/", users_router)
api.add_router("/services/", services_router)
api.add_router("/reviews/", reviews_router)
api.add_router("/specialists/", specialists_router)
api.add_router("/tags/", tags_router)
api.add_router("/badges/", badges_router)
api.add_router("/ranks/", ranks_router)
