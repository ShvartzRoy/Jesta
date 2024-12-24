from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.hashers import make_password
from .models import CustomUser
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
        return {"msg": "Logged out"}




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
