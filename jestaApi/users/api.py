from ninja import NinjaAPI, Router
from ninja.security import django_auth
from django.contrib.auth import authenticate, login, logout
from django.middleware.csrf import get_token
from .models import CustomUser as User
from .schemas import *
from .userController import userController


api = NinjaAPI(csrf=True)

router = Router(tags=["user"])
uc = userController()

@router.get("/get-csrf-token")
def get_csrf_token(request):
    return {"csrftoken": get_token(request)}


@router.post("/login", response={200: UserSchema, 401: Error})
def login(request, payload: LogInSchema):
    user = uc.login(request, payload)
    return user


@router.post("/logout", response={200: Msg}, auth=django_auth)
def logout_view(request):
    return uc.logout(request)


@router.get("/user",response={200: UserSchema, 401: Error}, auth=django_auth)
def user(request):
    return uc.user(request)


@router.post("/register", response={200: UserSchema, 401: Error})
def register(request, payload: RegisterSchema):
    user = uc.register(request, payload)
    return user
