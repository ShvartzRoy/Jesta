from ninja import Router
from .models import Review
from .schemas import ReviewCreateSchema, ReviewSchema
from .reviewController import ReviewController

router = Router(tags=["Reviews"])

rc = ReviewController()

@router.post("/add_review", response={201: ReviewSchema})
def add_review(request, payload: ReviewCreateSchema):
    return rc.add_review(request, payload)

@router.get("/get_reviews/{user_id}/", response={200: list[ReviewSchema]})
def get_reviews(request, user_id: int):
    return rc.get_reviews(request, user_id)

@router.delete("/delete_review/{review_id}/", response={200: dict,403: dict})
def delete_review(request, review_id: int):
    return rc.delete_review(request, review_id)

@router.get("/get_average_rating/{user_id}/", response={200: dict})
def get_average_rating(request, user_id: int):
    return rc.get_average_rating(request, user_id)
