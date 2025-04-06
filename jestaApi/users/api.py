from ninja import Form
from ninja import NinjaAPI, Router, File
from ninja.security import django_auth
from .schemas import *
from services.schemas import ServiceSchema
from specialists.schemas import SpecialistSchema
from .userController import userController
from .profileController import profileController
from ninja.files import UploadedFile
from ninja.errors import HttpError
from django.shortcuts import get_object_or_404
from services.models import Service

from .models import CustomUser
from .schemas import PushTokenSchema


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

# @router.post("/edit_profile", response={200: ProfileSchema, 401: Error})
# def edit_profile(request, payload: ProfileSchema, image: UploadedFile = File(None), resume: UploadedFile = File(None)):
#     user = pc.edit_profile(request, payload , image, resume)
#     return user


@router.post("/edit_profile", response={200: ProfileSchema, 401: Error})
def edit_profile(request, image: UploadedFile = File(None), resume: UploadedFile = File(None)):
    form_data = request.POST
    user = pc.edit_profile(request, form_data, image, resume)
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



@router.get("/get_saved_services/{user_id}", response=list)
def get_saved_services(request, user_id: int):
    user = get_object_or_404(CustomUser, id=user_id)
    return [service['id'] for service in user.saved_services]


@router.post("/save_push_token", response={200: Msg, 401: Error})
def save_push_token(request, payload: PushTokenSchema):
    return userController().save_push_token(request, payload)

@router.post("/set_user_city", response={200: Msg, 401: Error})
def set_user_city(request, data: CitySchema):
    if not request.user.is_authenticated:
        raise HttpError(401, "Unauthorized")
    profile, _ = Profile.objects.get_or_create(user=request.user)
    profile.city = data.city
    profile.save()
    return {"msg": f"City set to {data.city}"}


@router.put("/remove_profile_image", response={200: Msg, 401: Error})
def remove_profile_image(request):
    if not request.user.is_authenticated:
        raise HttpError(401, "Unauthorized")
    try:
        profile = Profile.objects.get(user=request.user)
        if profile.image:
            profile.image.delete()
            profile.image = None
            profile.save()
        return {"msg": "Profile image removed"}
    except Profile.DoesNotExist:
        raise HttpError(404, "Profile not found")
    
    
@router.put("/remove_resume", response={200: Msg, 401: Error})
def remove_resume(request):
    if not request.user.is_authenticated:
        raise HttpError(401, "Unauthorized")
    try:
        profile = Profile.objects.get(user=request.user)
        if profile.resume:
            profile.resume.delete()
            profile.resume = None
            profile.save()
        return {"msg": "Resume removed"}
    except Profile.DoesNotExist:
        raise HttpError(404, "Profile not found")



'''
@router.post("/share_saved_services_listing", response={200: dict, 400: dict})
def share_saved_services_listing_to_a_given_email(request, data: EmailSchema):
    return uc.share_saved_services_listing_to_a_given_email(request, data.email)
    
'''