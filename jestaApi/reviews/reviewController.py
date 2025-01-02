from ninja import Router
from django.shortcuts import get_object_or_404
from .models import Review
from users.models import CustomUser
from .schemas import ReviewCreateSchema, ReviewSchema
from django.conf import settings
from ninja.errors import HttpError

class ReviewController():
    def add_review(self, request, payload: ReviewCreateSchema) -> ReviewSchema:
        reviewer = request.user
        reviewed_user = get_object_or_404(CustomUser, id=payload.reviewed_user)
        if reviewer == reviewed_user:
            raise HttpError(400, "You cannot review yourself")
        if Review.objects.filter(reviewer=reviewer, reviewed_user=reviewed_user).exists():
            raise HttpError(400, "You have already reviewed this user")
        if len(payload.info) > 200:
            raise HttpError(400, "Review is too long")
        # in the future: check if the user has worked with the reviewed_user
        review = Review.objects.create(
            reviewer=reviewer,
            reviewed_user=reviewed_user,
            ranking=payload.ranking,
            info=payload.info,
        )
        review.save()
        return review
    
    def get_reviews(self, request, user_id: int) -> list[ReviewSchema]:
        user = get_object_or_404(CustomUser, id=user_id)
        reviews = Review.objects.filter(reviewed_user=user).order_by("-created_at")
        return reviews
    
    def delete_review(self, request, review_id: int) -> dict:
        review = get_object_or_404(Review, id=review_id)
        if review.reviewer != request.user:
            raise HttpError(403, "You cannot delete this review")
        review.delete()
        return {"message": "Review deleted"}
    
    def get_average_rating(self, request, user_id: int) -> dict:
        user = get_object_or_404(CustomUser, id=user_id)
        reviews = Review.objects.filter(reviewed_user=user)
        if reviews.count() == 0:
            return {"massage": "No reviews yet"}
        total = 0
        for review in reviews:
            total += review.ranking
        return {"average_rating": total / reviews.count()}