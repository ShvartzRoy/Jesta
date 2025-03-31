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

        existing_review = Review.objects.filter(
            reviewer=reviewer, 
            reviewed_user=reviewed_user, 
            service_id=payload.service
        ).first()

        if existing_review:
            existing_review.ranking = payload.ranking
            existing_review.info = payload.info
            existing_review.save()
            return existing_review

        if payload.info and len(payload.info) > 200:
            raise HttpError(400, "Review is too long")

        review = Review.objects.create(
            reviewer=reviewer,
            reviewed_user=reviewed_user,
            service_id=payload.service, 
            ranking=payload.ranking,
            info=payload.info,
        )

        return review

    def get_reviews(self, request, user_id: int) -> list[dict]:
        user = get_object_or_404(CustomUser, id=user_id)
        reviews = Review.objects.filter(reviewed_user=user).select_related("service", "reviewer").order_by("-created_at")

        enriched_reviews = []
        for review in reviews:
            enriched_reviews.append({
                "id": review.id,
                "reviewer": review.reviewer.id,
                "reviewer_name": review.reviewer.profile.name if hasattr(review.reviewer, "profile") else "Unknown",
                "reviewed_user": review.reviewed_user.id,
                "service": review.service.title if review.service else "Unknown",
                "ranking": review.ranking,
                "info": review.info,
                "created_at": review.created_at,
            })

        return enriched_reviews

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
    
    def check_if_review_exists(self, request, reviewed_user_id: int, service_id: int) -> dict:
        exists = Review.objects.filter(
            reviewer=request.user,
            reviewed_user_id=reviewed_user_id,
            service_id=service_id
        ).exists()
        return {"already_reviewed": exists}
    
    
    def get_reviews_written_by_user(self, request, reviewer_id: int):
        reviews = Review.objects.filter(reviewer__id=reviewer_id)
        return reviews
    
    
    def get_review_for_user_and_service(self, request, reviewed_user_id: int, service_id: int):
        try:
            review = Review.objects.get(
                reviewed_user=reviewed_user_id,
                reviewer=request.user,
                service=service_id
            )
            return review
        except Review.DoesNotExist:
            raise HttpError(404, "Review not found")



