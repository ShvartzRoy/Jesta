from ninja import Router
from django.shortcuts import get_object_or_404
from .models import Review
from users.models import CustomUser
from .schemas import ReviewCreateSchema, ReviewSchema
from django.conf import settings
from ninja.errors import HttpError
from new_ranks.xp_service import add_xp_for_positive_review 
from new_ranks.rankController import RankController 

 

 

class ReviewController():
    def add_review(self, request, payload: ReviewCreateSchema) -> ReviewSchema:
        from services.serviceController import ServiceController  

        reviewer = request.user
        reviewed_user = get_object_or_404(CustomUser, id=payload.reviewed_user)

        if reviewer == reviewed_user:
            raise HttpError(400, "You cannot review yourself")

        existing_review = Review.objects.filter(
            reviewer=reviewer, 
            reviewed_user=reviewed_user, 
            service_id=payload.service
        ).first()

        if payload.info and len(payload.info) > 200:
            raise HttpError(400, "Review is too long")

        sc = ServiceController()
        
        
        service = sc.get_service(payload.service)
        if not service:
            raise HttpError(404, "Service not found")
    
        if service.state != "completed":
            raise HttpError(400, "Service must be completed to leave a review")           

        if existing_review:
            existing_review.ranking = payload.ranking
            existing_review.info = payload.info
            existing_review.save()
   
            
            sc.send_notification(
                reviewed_user,
                "Review Updated",
                f"{reviewer.profile.name if hasattr(reviewer, 'profile') else 'Someone'} updated their review for you.",
                data={"type": "review_updated", "service_id": payload.service}
            )

            if payload.ranking >= 4.0:
                rc = RankController()
                rc.add_xp_for_positive_review(reviewed_user.id, payload.ranking)

            return existing_review

        review = Review.objects.create(
            reviewer=reviewer,
            reviewed_user=reviewed_user,
            service_id=payload.service, 
            ranking=payload.ranking,
            info=payload.info,
        )

        reviewer_name = reviewer.profile.name if hasattr(reviewer, "profile") and reviewer.profile.name else reviewer.username

        sc.send_notification(
            reviewed_user,
            "You Got a Review!",
            f"{reviewer_name} just left a review about you!",
            data={"type": "review", "reviewer_id": reviewer.id}
        )

        if payload.ranking >= 4.0:
            rc = RankController()
            rc.add_xp_for_positive_review(reviewed_user.id, payload.ranking)

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
    
    def calculate_average_rating(self, user_id: int) -> float:
        user = get_object_or_404(CustomUser, id=user_id)
        reviews = Review.objects.filter(reviewed_user=user)
        if not reviews.exists():
            return 0.0
        total = sum(review.ranking for review in reviews)
        return total / reviews.count()

    
    def get_average_rating(self, request, user_id: int) -> dict:
        return {"average_rating": self.calculate_average_rating(user_id)}

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



