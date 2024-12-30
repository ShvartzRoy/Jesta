from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.hashers import make_password
from ninja import File
from ninja.files import UploadedFile
from .models import CustomUser
from .schemas import *
from ninja.errors import *
from .check_fields import *


class userController:

    
    def login(self, request, payload: LogInSchema) -> UserSchema:
        user = authenticate(request, username=payload.email, password=payload.password)
        if user is not None:
            login(request, user)
            return user
        raise AuthenticationError("Invalid credentials")
    


    def logout(self, request) -> any:
        logout(request)
        return {"msg": "Logged out"}




    def user(self, request) -> UserSchema:
        return request.user



    def register(self, request, payload: RegisterSchema) -> UserSchema:
        check_email(payload.email)
        password_check(payload.password)
        # check if user exists
        if CustomUser.objects.filter(email=payload.email).exists():
            raise HttpError(400, "Email already exists")
        # Hash the password before saving
        payload.password = make_password(payload.password)
        user = CustomUser.objects.create(
            username=payload.email, email=payload.email, password=payload.password
        )
        user.save()
        return user
    

    def editProfile(self, request, payload: ProfileSchema, image: UploadedFile = File(None), resume: UploadedFile = File(None)) -> ProfileSchema:
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
        if payload.age is not None:
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
        profile.save()
        return profile
    

    def getProfile(self, request, user_id: int) -> ProfileSchema:
        user = CustomUser.objects.get(id=user_id)
        if user is None:
            raise HttpError(401, "User not found")
        try:
            profile = Profile.objects.get(user=user)
            return profile
        except Profile.DoesNotExist as e:
            raise HttpError(401, "Profile not found")
    
    def deleteUser(self, request, user_password) -> any:
        user = request.user
        if user.id is None:
            raise HttpError(401, "Unauthorized")
        if not user.check_password(user_password):
            raise HttpError(401, "Invalid password")
        user.delete()
        return {"msg": "User deleted"}