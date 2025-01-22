from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.hashers import make_password
from ninja import File
from ninja.files import UploadedFile
from .models import CustomUser
from services.models import Service
from specialists.schemas import SpecialistSchema
from .schemas import *
from ninja.errors import *
from .check_fields import *
from django.contrib.auth.hashers import check_password


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
        email = payload.email.lower()
        check_email(email)
        password_check(payload.password)
        # check if user exists
        if CustomUser.objects.filter(email= email).exists():
            raise HttpError(400, "Email already exists")
        # Hash the password before saving
        payload.password = make_password(payload.password)
        user = CustomUser.objects.create(
            username= email, email = email, password=payload.password
        )
        user.save()
        return user
    
    
    def delete_user(self, request, user_password) -> any:
        user = request.user
        if user.id is None:
            raise HttpError(401, "Unauthorized")
        if not user.check_password(user_password):
            raise HttpError(401, "Invalid password")
        try:
            profile = Profile.objects.get(user=user)
            if profile.image:
                profile.image.delete()
            if profile.resume:
                profile.resume.delete()
        except Profile.DoesNotExist as e:
            pass
        user.delete()
        return {"msg": "User deleted"}
    

    def change_email(self, request, new_email: str, password: str) -> dict:
        user = request.user
        # Check if the old password is correct
        if not check_password(password, user.password):
            raise HttpError(400, "Incorrect password")
        # check if user exists
        if CustomUser.objects.filter(email=new_email).exists():
            raise HttpError(400, "Email already exists")
        check_email(new_email)
        user.email = new_email
        user.save()
        return {"success": True, "message": "Email updated successfully"}
    

    def change_password(self, request, old_password: str, new_password: str) -> dict:
        user = request.user
        if not user.is_authenticated:
            raise HttpError(401, "Unauthorized")
        
        # Check if the old password is correct
        if not check_password(old_password, user.password):
            raise HttpError(400, "Incorrect password")
        
        # Set and save the new password
        user.set_password(new_password)
        user.save()
        return {"success": True, "message": "Password updated successfully"}
