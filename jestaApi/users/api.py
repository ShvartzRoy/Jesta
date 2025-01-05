from ninja import NinjaAPI, Router
from ninja.security import django_auth
from .schemas import *
from .userController import userController
from .profileController import profileController
from ninja import File
from ninja.files import UploadedFile


router = Router(tags=["user"])
uc = userController()
pc = profileController()

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

@router.put("/edit_profile", response={200: ProfileSchema, 401: Error})
def edit_profile(request, payload: ProfileSchema, image: UploadedFile = File(None), resume: UploadedFile = File(None)):
    user = pc.edit_profile(request, payload , image, resume)
    return user

@router.get("/get_profile/{user_id}", response={200: GetProfileSchema, 401: Error})
def get_profile(request, user_id: int):
    user = pc.get_profile(request, user_id)
    return user

@router.put("/change-email/", response={200: dict, 400: dict})
def update_email(request, email: str, password: str):
    return uc.change_email(request, email, password)

@router.put("/change-password/", response={200: dict, 400: dict})
def update_password(request, old_password: str, new_password: str):
    return uc.change_password(request, old_password, new_password)
