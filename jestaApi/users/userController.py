from ninja import NinjaAPI, Router
from ninja.security import django_auth
from django.contrib.auth import authenticate, login, logout
from django.middleware.csrf import get_token
from django.contrib.auth.hashers import make_password
from .models import CustomUser as User
from .schemas import *
from ninja.errors import *




class userController:
    

    def login(self, request, payload: LogInSchema) -> UserSchema:
        user = authenticate(request, username=payload.email, password=payload.password)
        if user is not None:
            login(request, user)
            return user
        raise AuthenticationError("Invalid credentials")


    def logout(self, request) -> any:
        logout(request)
        return {"message": "Logged out"}




    def user(self, request) -> UserSchema:
        return request.user



    def register(self, request, payload: RegisterSchema) -> UserSchema:
        # check if user exists
        if CustomUser.objects.filter(email=payload.email).exists():
            raise HttpError(401, "Email already exists")
        # Hash the password before saving
        payload.password = make_password(payload.password)
        user = CustomUser.objects.create(
            username=payload.email, email=payload.email, password=payload.password
        )
        user.save()
        return user
        # try:
            
        #     user = User.objects.create_user(username=payload.email, email=payload.email, password=payload.password)
        #     return user
        # except Exception as e:
        #     raise AuthenticationError(str(e))
