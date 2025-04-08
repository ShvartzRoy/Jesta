from ninja import Form
from ninja import NinjaAPI, Router, File
from ninja.security import django_auth
from .schemas import *
from services.schemas import ServiceSchema
from specialists.schemas import SpecialistSchema
from .userController import userController
from .profileController import profileController
from ninja.files import UploadedFile
from ninja.errors import HttpError, ValidationError
from django.shortcuts import get_object_or_404
from services.models import Service
from users.schemas import Error

from .models import CustomUser
from .schemas import PushTokenSchema

from django.core.mail import send_mail
from django.contrib.auth.hashers import make_password
from django.conf import settings
from django.core.cache import cache

from ninja.responses import Response
from django.http import JsonResponse


import random



def generate_code():
    return str(random.randint(100000, 999999))


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
    

@router.post("/send_verification_code", response={200: Msg, 400: Error})
def send_verification_code(request, data: EmailOnlySchema):
    email = data.email

    if CustomUser.objects.filter(email=email).exists():
        raise HttpError(400, "Email already exists")

    code = str(random.randint(100000, 999999))
    cache.set(f"email_code_{email}", code, timeout=10 * 60)

    try:
        send_mail(
            subject="Your Verification Code",
            message=f"Your verification code is: {code}",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=False,
        )
        return {"msg": "Verification code sent successfully"}  
    except Exception as e:
        raise HttpError(400, f"Failed to send email: {str(e)}") 



@router.post("/verify_code", response={200: UserSchema, 400: Error})
def verify_code(request, data: VerifyCodeSchema):
    email = data.email
    password = data.password
    referral_code = data.referral_code
    code = data.code

    cached_code = cache.get(f"email_code_{email}")
    if not cached_code or cached_code != code:
        raise HttpError(400, "Invalid or expired code")

    if CustomUser.objects.filter(email=email).exists():
        raise HttpError(400, "User already exists")

    referred_by = None
    if referral_code:
        try:
            referred_by = CustomUser.objects.get(referral_code=referral_code)
        except CustomUser.DoesNotExist:
            raise HttpError(400, "Invalid referral code")

    user = CustomUser.objects.create(
        username=email,
        email=email,
        password=make_password(password),
        referred_by=referred_by
    )

    if referred_by:
        from new_ranks.xp_service import XPService
        XPService().add_xp_for_referral(referred_by.id)
        XPService().add_xp_for_referral(user.id)


    print("verify_code called:", request.user.is_authenticated)

    from django.contrib.auth import login 

    login(request, user)
    return user



@router.get("/validate_referral_code", response={200: dict})
def validate_referral_code(request, referral_code: str):
    valid = CustomUser.objects.filter(referral_code=referral_code.strip()).exists()
    return {"valid": valid}


@router.get("/get_user_city", response={200: dict, 401: Error})
def get_user_city(request):
    if not request.user.is_authenticated:
        raise HttpError(401, "Unauthorized")
    
    try:
        profile = Profile.objects.get(user=request.user)
        return {"city": profile.city}
    except Profile.DoesNotExist:
        return {"city": None}





'''
@router.post("/share_saved_services_listing", response={200: dict, 400: dict})
def share_saved_services_listing_to_a_given_email(request, data: EmailSchema):
    return uc.share_saved_services_listing_to_a_given_email(request, data.email)
    
'''