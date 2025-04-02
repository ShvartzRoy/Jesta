from typing import Optional
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from ninja.errors import HttpError
from .schemas import RankCreateSchema, RankSchema
from .models import Rank
from new_badges.models import Badge
from users.models import Profile
from .models import Rank
from services.models import Service
from new_ranks.xp_service import add_xp_for_positive_review  


class RankController:

    XP_LEVEL = 500
    

    def create_rank(self, request, payload: RankCreateSchema) -> RankSchema:
        user = request.user
        if user.id != payload.user_id:
            raise HttpError(403, "You cannot create a rank for another user")
        if payload.xp < 0:
            raise HttpError(400, "XP cannot be negative")
        if payload.level < 0:
            raise HttpError(400, "Level cannot be negative")
        if payload.level > 100:
            raise HttpError(400, "Level cannot be greater than 100")
        if payload.xp > 1000000:
            raise HttpError(400, "XP cannot be greater than 1,000,000")

        rank = Rank.objects.create(user=user, xp=payload.xp, level=payload.level)
        if payload.badges:
            badges = Badge.objects.filter(name__in=payload.badges)
            rank.badges.set(badges)
        rank.save()
        return RankSchema(
            id=rank.id,
            user_id=rank.user.id,
            xp=rank.xp,
            level=rank.level,
            badges=[badge.name for badge in rank.badges.all()]
        )

    def get_rank(self, request, user_id: int) -> Rank:
        User = get_user_model()
        user = get_object_or_404(User, id=user_id)
        return Rank.objects.get(user=user)

    def add_xp(self, user_id: int, xp: int) -> bool:
        if xp < 0:
            raise HttpError(400, "XP cannot be negative")
        User = get_user_model()
        user = get_object_or_404(User, id=user_id)
        rank = Rank.objects.filter(user=user).first()
        if not rank:
            rank = Rank.objects.create(user=user)

        rank.xp += xp
        rank.save()  
        self.update_level(user_id)

        print(f"[XP DEBUG] User {user.id} - Added {xp}, New XP: {rank.xp}")
        return True



    def update_level(self, user_id: int) -> bool:
        User = get_user_model()
        user = get_object_or_404(User, id=user_id)
        rank = Rank.objects.get(user=user)

        new_level = (rank.xp // self.XP_LEVEL) + 1
        if new_level != rank.level:
            print(f"[LEVEL UP] User {user.id} - Level changed from {rank.level} to {new_level}")
            rank.level = new_level
            rank.save()
            self.update_badges(user_id)

        return True

    def update_badges(self, user_id: int) -> bool:
        User = get_user_model()
        user = get_object_or_404(User, id=user_id)
        rank = Rank.objects.get(user=user)

        #Badge criteria
        badges_to_add = []

        #Level-based badge
        if rank.level >= 5:
            badge, _ = Badge.objects.get_or_create(name="Experienced")
            badges_to_add.append(badge)

        #Review-based badge
        from reviews.reviewController import ReviewController
        review_controller = ReviewController()
        avg_rating = review_controller.get_average_rating(None, user.id).get("average_rating", 0)
        if avg_rating >= 4.5:
            badge, _ = Badge.objects.get_or_create(name="Excellent")
            badges_to_add.append(badge)

        #Volunteer service badge
        completed_volunteer_count = Service.objects.filter(user_id=user.id, is_volunteering=True, state="completed").count()
        if completed_volunteer_count >= 5:
            badge, _ = Badge.objects.get_or_create(name="Community Contributor")
            badges_to_add.append(badge)

        for badge in badges_to_add:
            if badge not in rank.badges.all():
                rank.badges.add(badge)

        rank.save()
        return True

    def get_badges(self, user_id: int) -> list[Badge]:
        User = get_user_model()
        user = get_object_or_404(User, id=user_id)
        rank = Rank.objects.get(user=user)
        return list(rank.badges.all())
    
    

    def get_level(self, user_id: int) -> int:
        User = get_user_model()
        user = get_object_or_404(User, id=user_id)
        rank = Rank.objects.filter(user=user).first()
        if not rank:
            rank = Rank.objects.create(user=user)

        return rank.level


    def get_xp(self, user_id: int) -> int:
        User = get_user_model()
        user = get_object_or_404(User, id=user_id)
        rank = Rank.objects.filter(user=user).first()
        if not rank:
            rank = Rank.objects.create(user=user)

        return rank.xp


    def add_xp_for_completed_service(self, user_id: int, is_volunteer=False):
        xp = 150 if is_volunteer else 100 
        self.add_xp(user_id, xp)

    def add_xp_for_positive_review(self, user_id: int, rating: int):
        if rating >= 4:
            self.add_xp(user_id, 50)

    def add_xp_for_referral(self, user_id: int):
        self.add_xp(user_id, 200)
