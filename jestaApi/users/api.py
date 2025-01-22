from ninja import NinjaAPI, Router
from ninja.security import django_auth
from .schemas import *
from services.schemas import ServiceSchema
from specialists.schemas import SpecialistSchema
from .userController import userController
from ninja import File
from ninja.files import UploadedFile


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

@router.delete("/delete_user", response={200: Msg, 401: Error})
def delete_user(request, user_password: str):
    return uc.delete_user(request, user_password)

@router.post("/edit_profile", response={200: ProfileSchema, 401: Error})
def edit_profile(request, payload: ProfileSchema, image: UploadedFile = File(None), resume: UploadedFile = File(None)):
    user = uc.edit_profile(request, payload , image, resume)
    return user

@router.get("/get_profile/{user_id}", response={200: ProfileSchema, 401: Error})
def get_profile(request, user_id: int):
    user = uc.get_profile(request, user_id)
    return user
