from ninja import NinjaAPI, Router
from ninja.security import django_auth
from .schemas import *
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

@router.delete("/deleteUser", response={200: Msg, 401: Error})
def deleteUser(request, user_password: str):
    return uc.deleteUser(request, user_password)

@router.post("/editProfile", response={200: ProfileSchema, 401: Error})
def editpProfile(request, payload: ProfileSchema, image: UploadedFile = File(None), resume: UploadedFile = File(None)):
    user = uc.edit_profile(request, payload , image, resume)
    return user

@router.get("/getProfile/{int:user_id}", response={200: ProfileSchema, 401: Error})
def getProfile(request, user_id: int):
    user = uc.getProfile(request, user_id)
    return user
