from typing import Optional
from django.conf import settings
from django.shortcuts import get_object_or_404
from django.core.exceptions import ValidationError
from dateutil.parser import parse
from .schemas import RankCreateSchema, RankSchema
from tags.models import Tag
from ninja.errors import HttpError
from dateutil.parser import isoparse
from datetime import timedelta
from .models import Rank
from reviews import reviewController
from badges.models import Badge

class RankController():

    XP_LEVEL = 500
    XP_JOB_COMPLETED = 100

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
        rank = Rank.objects.create(
            user =user,
            xp = 0,
            badges = payload.badges,
            level = 1,
        )
        rank.save()
        return RankSchema.from_orm(rank)
    

    def get_rank(self, request, user_id: int) -> Rank:
        user = get_object_or_404(settings.AUTH_USER_MODEL, id=user_id)
        rank = Rank.objects.get(user=user)
        return rank
    
    def add_xp(self, user_id: int, xp: int) -> bool:
        if xp < 0:
            raise HttpError(400, "XP cannot be negative")
        user = get_object_or_404(settings.AUTH_USER_MODEL, id=user_id)
        rank = Rank.objects.get(user=user)
        rank.xp += xp
        self.update_level(user_id)
        rank.save()
        return True
        return True
         
    def update_level(self, user_id: int) -> bool:
        user = get_object_or_404(settings.AUTH_USER_MODEL, id=user_id)
        rank = Rank.objects.get(user=user)
        rank.level = rank.xp // self.XP_LEVEL
        self.update_badges(user_id)
        rank.save()
        return True
    
    def update_badges(self, user_id: int) -> bool:
        """
        Updates the badges for a user based on their achievements.
        - "Verified": For verifying identity
        - "Student": For verifying student email
        - "Experienced": For reaching level 5+
        - "Community Contributor": For completing 5 volunteer tasks
        - "Excellent": For having a 4.0+ rating

        Args:
            user_id (int): The ID of the user whose badges are to be updated.

        Returns:
            bool: True if the badges were updated successfully, False otherwise.
        """
        
        user = get_object_or_404(settings.AUTH_USER_MODEL, id=user_id)
        rank = Rank.objects.get(user=user)
        badges = rank.badges
        
        # Verified badge
        # TODO

        # Student badge 
        # TODO

        # Experienced badge
        if rank.level >= 5:
            experienced_badge, created = Badge.objects.get_or_create(name="Experienced")
            if experienced_badge not in badges:
                badges.append(experienced_badge)

        # Community Contributor badge
        # TODO

        # Excellent badge
        rec = reviewController.ReviewController()
        dic = rec.get_average_rating(user_id)
        if dic["average_rating"] >= 4.5:
            excellent_badge, created = Badge.objects.get_or_create(name="Excellent")
            if excellent_badge not in badges:
                badges.append(excellent_badge)

        # Save the updated badges
        rank.badges.set(badges)  # Use set to avoid duplicates
        rank.save()

        return rank.save()
    
    def get_badges(self, user_id: int) -> list[Badge]:
        user = get_object_or_404(settings.AUTH_USER_MODEL, id=user_id)
        rank = Rank.objects.get(user=user)
        return list(rank.badges.all())
    
    def get_level(self, user_id: int) -> int:
        user = get_object_or_404(settings.AUTH_USER_MODEL, id=user_id)
        rank = Rank.objects.get(user=user)
        return rank.level
    
    def get_xp(self, user_id: int) -> int:
        user = get_object_or_404(settings.AUTH_USER_MODEL, id=user_id)
        rank = Rank.objects.get(user=user)
        return rank.xp
