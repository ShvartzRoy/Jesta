import json
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.hashers import make_password
from ninja import File
from ninja.files import UploadedFile
from .models import CustomUser
from .schemas import *
from ninja.errors import *
from .check_fields import *
from new_ranks.models import Rank 
from new_badges.schemas import BadgeSchema
from ninja.errors import HttpError
from django.http import QueryDict



class profileController:
    
    
    # def edit_profile(self, request, payload: ProfileSchema, image: UploadedFile = File(None), resume: UploadedFile = File(None)) -> ProfileSchema:
    #         user = request.user
    #         if user.id is None:
    #             raise HttpError(401, "Unauthorized")
    #         # Get or create the profile for the user
    #         profile, _ = Profile.objects.get_or_create(user=user)
    #         # Update the profile fields
    #         if payload.name is not None:
    #             check_name(payload.name)
    #             profile.name = payload.name
    #         if payload.bio is not None:
    #             profile.bio = payload.bio
    #         check_age(payload.age)
    #         profile.age = payload.age
    #         # Handle image upload
    #         if image is not None:
    #             check_image(image)
    #             if profile.image:
    #                 profile.image.delete()
    #             profile.image.save(f'{user.id}.jpg', image)
    #         if resume is not None:
    #             check_resume(resume)
    #             if profile.resume:
    #                 profile.resume.delete()
    #             profile.resume.save(f'{user.id}.pdf', resume)
    #         if payload.facebook is not None:
    #             profile.facebook = payload.facebook
    #         if payload.linkedin is not None:
    #             profile.linkedin = payload.linkedin
    #         if payload.instagram is not None:
    #             profile.instagram = payload.instagram
    #         profile.save()
    #         return profile
    
    
    
    def edit_profile(self, request, data, image: UploadedFile = None, resume: UploadedFile = None) -> ProfileSchema:
        user = request.user
        if user.id is None:
            raise HttpError(401, "Unauthorized")

        profile, _ = Profile.objects.get_or_create(user=user)

        if isinstance(data, QueryDict) and "payload" in data:
            try:
                data = json.loads(data["payload"])
            except json.JSONDecodeError:
                raise HttpError(400, "Invalid JSON in payload")

        if data.get("name"):
            check_name(data["name"])
            profile.name = data["name"]

        if data.get("bio") is not None:
            profile.bio = data["bio"]

        if data.get("age") is not None:
            check_age(data["age"])
            profile.age = data["age"]

        profile.facebook = data.get("facebook") or ""
        profile.linkedin = data.get("linkedin") or ""
        profile.instagram = data.get("instagram") or ""
        profile.city = data.get("city") or ""
        profile.phone_number = data.get("phone_number") or ""


        if image:
            check_image(image)
            if profile.image and profile.image.name != f'profile_images/{user.id}.jpg':
                profile.image.delete(save=False)  
            profile.image.save(f'{user.id}.jpg', image)


        if resume:
            check_resume(resume)
            if profile.resume:
                profile.resume.delete()
            profile.resume.save(f'{user.id}.pdf', resume)

        profile.save()
        return profile

        

    def get_profile(self, request, user_id: int) -> dict:
        try:
            user = CustomUser.objects.get(id=user_id)
        except CustomUser.DoesNotExist:
            raise HttpError(401, "User not found")

        profile, _ = Profile.objects.get_or_create(user=user)

        try:
            rank = Rank.objects.get(user=user)
            level = rank.level
        except Rank.DoesNotExist:
            level = 1

        from new_badges.badgeController import BadgeController
        BadgeController().check_and_assign_all_badges(user)

        data = GetProfileSchema.from_orm(profile).dict()

        badge_list = profile.badges.all()
        data["badges"] = [BadgeSchema.from_orm(badge).dict() for badge in badge_list]
        data["level"] = level
        
        data["referral_code"] = user.referral_code 
        

        

        return data

