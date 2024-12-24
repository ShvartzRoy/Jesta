from ninja import NinjaAPI, Router
from ninja.security import django_auth
from .schemas import *
from .userController import userController



router = Router(tags=["user"])
uc = userController()


@router.post("/login", response={200: UserSchema, 401: Error})
def login(request, payload: LogInSchema):
    user = uc.login(request, payload)
    return user


@router.post("/logout", response={200: Msg})
def logout(request):
    return uc.logout(request)


@router.get("/user",response={200: UserSchema, 401: Error}, auth=django_auth)
def user(request):
    return uc.user(request)


@router.post("/register", response={200: UserSchema, 401: Error})
def register(request, payload: RegisterSchema):
    user = uc.register(request, payload)
    return user
