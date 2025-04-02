from django.shortcuts import get_object_or_404
from django.conf import settings
from .models import Rank
from reviews.models import Review
from services.models import Service
from new_ranks.models import Rank
from django.contrib.auth import get_user_model

class XPService:

    XP_JOB_COMPLETED = 100 
    XP_VOLUNTEERING_COMPLETED = 120
    XP_REVIEW_POSITIVE = 50
    XP_REFERRAL = 200
    LEVEL_XP_THRESHOLD = 500







    def update_level(self, rank):
        new_level = rank.xp // self.LEVEL_XP_THRESHOLD
        if new_level > rank.level:
            rank.level = new_level
            
def add_xp_for_positive_review(self, reviewed_user_id: int, rating: float):
    if rating >= 4.0:
        user = get_object_or_404(settings.AUTH_USER_MODEL, id=reviewed_user_id)
        rank, created = Rank.objects.get_or_create(user=user)
        rank.xp += self.XP_REVIEW_POSITIVE
        self.update_level(rank)
        rank.save()
            
def add_xp_for_completed_service(self, user_id: int, is_volunteering=False):
    user = get_object_or_404(settings.AUTH_USER_MODEL, id=user_id)
    rank, created = Rank.objects.get_or_create(user=user)
    rank.xp += self.XP_VOLUNTEERING_COMPLETED if is_volunteering else self.XP_JOB_COMPLETED
    self.update_level(rank)
    rank.save()
            
def add_xp_for_referral(self, referrer_id: int):
    User = get_user_model()
    referrer = get_object_or_404(User, id=referrer_id)

    rank, created = Rank.objects.get_or_create(user=referrer)
    rank.xp += self.XP_REFERRAL
    self.update_level(rank)
    rank.save()

    print(f"{referrer.email} earned XP for a referral!")

