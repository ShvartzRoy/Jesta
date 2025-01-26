from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.hashers import make_password
from ninja import File
from ninja.files import UploadedFile
from .models import CustomUser
from .schemas import *
from ninja.errors import *
from .check_fields import *

class profileController:
    def edit_profile(self, request, payload: ProfileSchema, image: UploadedFile = File(None), resume: UploadedFile = File(None)) -> ProfileSchema:
            user = request.user
            if user.id is None:
                raise HttpError(401, "Unauthorized")
            # Get or create the profile for the user
            profile, _ = Profile.objects.get_or_create(user=user)
            # Update the profile fields
            if payload.name is not None:
                check_name(payload.name)
                profile.name = payload.name
            if payload.bio is not None:
                profile.bio = payload.bio
            check_age(payload.age)
            profile.age = payload.age
            # Handle image upload
            if image is not None:
                check_image(image)
                if profile.image:
                    profile.image.delete()
                profile.image.save(f'{user.id}.jpg', image)
            if resume is not None:
                check_resume(resume)
                if profile.resume:
                    profile.resume.delete()
                profile.resume.save(f'{user.id}.pdf', resume)
            if payload.facebook is not None:
                profile.facebook = payload.facebook
            if payload.linkedin is not None:
                profile.linkedin = payload.linkedin
            if payload.instagram is not None:
                profile.instagram = payload.instagram
            profile.save()
            return profile
    

    def get_profile(self, request, user_id: int) -> GetProfileSchema:
        try:
            user = CustomUser.objects.get(id=user_id)
        except CustomUser.DoesNotExist as e:
            raise HttpError(401, "User not found")
        try:
            profile = Profile.objects.get(user=user)
            return profile
        except Profile.DoesNotExist as e:
            raise HttpError(401, "Profile not found")