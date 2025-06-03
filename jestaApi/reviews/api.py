from ninja import Router
from .models import Review
from .schemas import ReviewCreateSchema, ReviewSchema
from .reviewController import ReviewController
from ninja import NinjaAPI
from ninja.security import django_auth 

api = NinjaAPI(auth=django_auth)

router = Router(tags=["Reviews"])

rc = ReviewController()

# @router.post("/add_review", response={201: ReviewSchema})
# def add_review(request, payload: ReviewCreateSchema):
#     return rc.add_review(request, payload)


@router.post("/add_review", response={201: ReviewSchema})
def add_review(request, payload: ReviewCreateSchema):
    return rc.add_review(request, payload)



@router.get("/get_reviews/{user_id}/", response={200: list[dict]})
def get_reviews(request, user_id: int):
    return rc.get_reviews(request, user_id)

@router.delete("/delete_review/{review_id}/", response={200: dict,403: dict})
def delete_review(request, review_id: int):
    return rc.delete_review(request, review_id)

@router.get("/get_average_rating/{user_id}/", response={200: dict})
def get_average_rating(request, user_id: int):
    return rc.get_average_rating(request, user_id)

@router.get("/check_review_exists", response={200: dict})
def check_review_exists(request, reviewed_user_id: int, service_id: int):
    return rc.check_if_review_exists(request, reviewed_user_id, service_id)

@router.get("/get_written_reviews/{reviewer_id}/", response={200: list[ReviewSchema]})
def get_written_reviews(request, reviewer_id: int):
    return rc.get_reviews_written_by_user(request, reviewer_id)


@router.get("/get_review_for_user_service", response={200: ReviewSchema, 404: dict})
def get_review_for_user_service(request, reviewed_user_id: int, service_id: int):
    if not request.user.is_authenticated:
        raise HttpError(401, "Unauthorized")
    return rc.get_review_for_user_and_service(request, reviewed_user_id, service_id)
