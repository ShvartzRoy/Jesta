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
# from django.core.mail import send_mail
# from django.conf import settings
import requests
from new_ranks.xp_service import add_xp_for_referral



def send_push_notification_to_user(user, title, body, data={}):
    if not isinstance(user.expo_push_tokens, list):
        print("expo_push_tokens is not a list!")
        return

    for token in user.expo_push_tokens:
            print(f"Sending notification to: {token}")
            message = {
                "to": token,
                "sound": "default",
                "title": title,
                "body": body,
                "data": data,
            }
            response = requests.post("https://exp.host/--/api/v2/push/send", json=message)
            print("Expo Response:", response.status_code, response.text)




class userController:
    
    def login(self, request, payload: LogInSchema) -> UserSchema:
        user = authenticate(request, username=payload.email, password=payload.password)
        
        if user is not None:
            login(request, user)
            
            
        if user.is_authenticated:
            send_push_notification_to_user(user, "Hello again!", "You are logged in.")
            return user
        
            return user
        raise AuthenticationError("Invalid credentials")
        
        
        
       


    def logout(self, request) -> any:
        
        user = request.user
        token = request.headers.get('Expo-Push-Token')
        device_id = request.headers.get('Device-Id')

        if token and device_id:
            original_len = len(user.expo_push_tokens)
            user.expo_push_tokens = [
                t for t in user.expo_push_tokens if not (
                    t['token'] == token and t['device'] == device_id
                )
            ]
            user.save()
            print(f"Removed token {token} for device {device_id}, removed {original_len - len(user.expo_push_tokens)}")
        else:
            print("No valid token or device ID provided.")


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
        
        
        #Handle referral
        referred_by = None
        if payload.referral_code:
            try:
                referred_by = CustomUser.objects.get(referral_code=payload.referral_code)
            except CustomUser.DoesNotExist:
                raise HttpError(400, "Invalid referral code")
            
        
        
        # Hash the password before saving
        payload.password = make_password(payload.password)
        user = CustomUser.objects.create(
            username= email, email = email, password=payload.password,  referred_by=referred_by,
        )
        user.save()
        
        if referred_by:
            add_xp_for_referral(referred_by.id)

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
    
    
    def get_saved_services(self, request) -> list:
        user = request.user
        if not user.is_authenticated:
            raise HttpError(401, "Unauthorized")
        return user.saved_services
   
   
   
    def save_push_token(self, request, payload: PushTokenSchema) -> dict:
        if not request.user.is_authenticated:
            raise HttpError(401, "Unauthorized")

        token_data = {"token": payload.token, "device": payload.device_id}

        if token_data not in request.user.expo_push_tokens:
            request.user.expo_push_tokens.append(token_data)
            request.user.save()
            print(f"Saved token for device {payload.device_id}: {payload.token}")
        else:
            print(f"Token already exists for device {payload.device_id}")

        return {"msg": "Push token saved successfully"}


   
    '''
    #later make sharing possible, like open different platforms to share the saved servicess
    def share_saved_services_listing_to_a_given_email(self, request, email: str) -> dict:
        user = request.user
        saved_services = user.saved_services 
        if not saved_services:
            return {"message": "No saved services to share."}
        
        services_list = "\n".join(
            [f"ID: {service['id']}, Title: {service['title']}, State: {service['state']}" for service in saved_services]
        )
        
        email_subject = f"{user.email} has shared their saved services with you!!"
        email_body = (
            f"Hello,\n\n"
            f"{user.email} has shared their saved services listing with you. Here are the details:\n\n"
            f"{services_list}\n\n"
            f"Best regards,\nYour Platform Team"
        )
        
        try:
            send_mail(
                subject=email_subject,
                message=email_body,
                from_email=settings.DEFAULT_FROM_EMAIL,  
                recipient_list=[email],
                fail_silently=False,
            )
            return {"message": f"Saved services listing shared successfully to {email}."}
        except Exception as e:
            return {"error": f"Failed to send email. Error: {str(e)}"}

        '''