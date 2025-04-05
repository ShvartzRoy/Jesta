from typing import Optional
from django.conf import settings
from django.shortcuts import get_object_or_404
from django.core.exceptions import ValidationError
from dateutil.parser import parse
from django.contrib.auth import get_user_model
from .models import Service, JobService, FreeService, VolunteeringService
from .schemas import ServiceCreateSchema, ServiceSchema
from tags.models import Tag
from ninja.errors import HttpError
from dateutil.parser import isoparse
from datetime import timedelta
from users.models import CustomUser
from notifications.models import Notification
import requests
from django.utils import timezone
from new_ranks.xp_service import add_xp_for_completed_service  
from new_ranks.rankController import RankController
from new_badges.badgeController import BadgeController






class ServiceController:
    
    def send_notification(self, user_or_id, title, body, data={}):       
        if isinstance(user_or_id, int):
            try:
                user = CustomUser.objects.get(id=user_or_id)
            except CustomUser.DoesNotExist:
                print(f"No user found with ID {user_or_id}")
                return
        else:
            user = user_or_id
            
            
        Notification.objects.create(
            user=user,
            title=title,
            body=body,
            data=data,
    )

        if not isinstance(user.expo_push_tokens, list) or len(user.expo_push_tokens) == 0:
            print(f"No tokens for user {user.id}")
            return

        for token_data in user.expo_push_tokens:
            token = token_data.get("token")
            if not token:
                print(f"Malformed token data: {token_data}")
                continue

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

        
    def create_service(self, request, payload):
        if isinstance(payload.estimated_duration, str):
            try:
                payload.estimated_duration = isoparse(payload.estimated_duration) - isoparse("PT0S")
            except ValueError:
                raise HttpError(400, "Invalid estimated duration format! Use ISO 8601, like 'PT50M' for 50 minutes.")
        
        tags = [Tag.objects.get_or_create(name=tag_name)[0] for tag_name in payload.tags]
        
        #publisher or provider
        service_from = payload.service_from or "publisher"
        
        if payload.offered_payment and payload.offered_payment > 0 and payload.is_volunteering==True:
            raise HttpError(400, "You cannot offer a payment for a volunteering service!")
        
        if payload.offered_payment and payload.offered_payment > 0:
            service = JobService.objects.create(
                user=request.user,
                title=payload.title,
                description=payload.description,
                location=payload.location,
                date_time_range=payload.date_time_range,
                estimated_duration=payload.estimated_duration,
                state="pending",
                service_from=service_from,
                is_volunteering=False,
                is_job=True,
                offered_payment=payload.offered_payment,
                applicants=[],
            )
            
        if payload.offered_payment == 0 and payload.is_volunteering==False:
            service = FreeService.objects.create(
                user=request.user,
                title=payload.title,
                description=payload.description,
                location=payload.location,
                date_time_range=payload.date_time_range,
                estimated_duration=payload.estimated_duration,
                state="pending",
                service_from=service_from,
                is_volunteering=False,
                is_job=False,
                offered_payment=0,
                applicants=[],

            )
                
        if payload.offered_payment == 0 and payload.is_volunteering==True:
            service = VolunteeringService.objects.create(
                user=request.user,
                title=payload.title,
                description=payload.description,
                location=payload.location,
                date_time_range=payload.date_time_range,
                estimated_duration=payload.estimated_duration,
                state="pending",
                service_from=service_from,
                is_volunteering=True,
                is_job=False,
                offered_payment=0,
                applicants=[],

            )
        
        service.tags.set(tags)
        
        return ServiceSchema.from_model(service).dict()


    
    def delete_service(self, request, service_id: int) -> dict:
        service = get_object_or_404(Service, id=service_id)
        if service.user != request.user:
            raise HttpError(403, "You do not have permission to delete this service!")
        
        for applicant in service.applicants:
            try:
                applicant_user = CustomUser.objects.get(id=applicant["user_id"])
                self.send_notification(
                    applicant_user,
                    "Service Removed",
                    f"The service '{service.title}' has been deleted by the creator.",
                    data={"type": "service_deleted", "service_id": service.id}
                )
            except CustomUser.DoesNotExist:
                print(f"Could not find user with ID {applicant['user_id']} to notify about service deletion")

        service.delete()
        return {"message": "Service deleted and all applicants were notified."}
        



    def update_name(self, service: Service, new_data: str) -> bool:
        service.title = new_data
        service.save()
        return True

    def update_description(self, service: Service, new_data: str) -> bool:
        service.description = new_data
        service.save()
        return True

    def update_tags(self, service: Service, new_data: list[str]) -> bool:
        tags = []
        for tag_name in new_data:
            tag, created = Tag.objects.get_or_create(name=tag_name)
            tags.append(tag)
        service.tags.set(tags)
        service.save()
        return True

    def update_location(self, service: Service, new_data: str) -> bool:
        service.location = new_data
        service.save()
        return True

    def update_date_time_range(self, service: Service, new_data: list) -> bool:
        if not isinstance(new_data, list) or len(new_data) != 2:
            raise ValidationError("Invalid format: new_data must be a list of two ISO 8601 date strings!")
        
        try:
            parse(new_data[0])
            parse(new_data[1])
            
        except ValueError:
            raise ValidationError("Invalid date format: Dates must be in ISO 8601 format!")
        
        service.date_time_range = new_data
        service.save()
        return True

    def update_estimated_duration(self, service: Service, new_data: str) -> bool:
        service.estimated_duration = new_data
        service.save()
        return True

    

    def update_offered_payment(self, service: Service, new_data: float) -> bool:
        if not service.is_job:
            raise HttpError(400, "Service not found or not a JobService!!")

        service.offered_payment = new_data
        if new_data == 0:
            service.is_job = False
    
        service.save()
        return True





    def apply_to_service(self, request, service_id: int) -> dict:
        service = get_object_or_404(Service, id=service_id)

        if service.user == request.user:
            raise HttpError(400, "You cannot apply to your own service!")

        if {"user_id": request.user, "applicant_state": "pending"} in service.applicants:
            raise HttpError(400, "You have already applied to this service!")

        if service.state not in ["pending", "accepted"]:
            raise HttpError(400, "Service is not available for application!")

        service.applicants = [
            applicant for applicant in service.applicants
            if not (applicant["user_id"] == request.user.id and applicant["applicant_state"] == "rejected")
        ]

        service.applicants.append({"user_id": request.user.id, "applicant_state": "pending"})
        service.save()

        from notifications.models import Notification
        recent_time_threshold = timezone.now() - timedelta(minutes=3)
        recent_similar = Notification.objects.filter(
            user=service.user,
            title="New Application!",
            data__service_id=service.id,
            read=False,
            created_at__gte=recent_time_threshold
        ).exists()

        if not recent_similar:
            user_name = getattr(request.user.profile, "name", request.user.username)
            self.send_notification(
                service.user,
                "New Application!",
                f"{user_name} applied to your service '{service.title}'.",
                data={"type": "new_applicant", "service_id": service.id}
            )

        return {"message": "Application successful!"}


    def remove_from_service(self, request, service_id: int) -> dict:
        service = get_object_or_404(Service, id=service_id)
        applicants = service.applicants

        was_accepted = False

        for applicant in applicants:
            if applicant["user_id"] == request.user.id:
                if applicant["applicant_state"] == "accepted":
                    was_accepted = True
                applicants.remove(applicant)
                break
        else:
            raise HttpError(400, "You have not applied to this service!")

        service.applicants = applicants
        service.save()

        if was_accepted:
            user_name = getattr(request.user.profile, "name", request.user.username)
            self.send_notification(
                service.user,
                "Accepted Applicant Unapplied",
                f"{user_name} was accepted to your service '{service.title}' but has now unapplied.",
                data={"type": "applicant_unapplied", "service_id": service.id}
            )

        return {"message": "Removed from service successfully!"}

            
    def get_applicants(self, request, service_id: int) -> list:
        service = get_object_or_404(Service, id=service_id)
        return service.applicants



    
    #later will make a smarter search!! 
    #it will not include completed services
    def search_needed_services(self, request, search_criteria: dict) -> list:
        services = Service.objects.filter(
            location__icontains=search_criteria.get("location", ""),
            state="pending"
        )

        if "tags" in search_criteria:
            services = services.filter(tags__name__in=search_criteria["tags"])

        if "duration" in search_criteria and search_criteria["duration"]:
            duration = search_criteria["duration"]
            services = services.filter(estimated_duration__lte=duration)

        if "price_range" in search_criteria and search_criteria["price_range"]:
            min_price, max_price = search_criteria["price_range"]
            services = services.filter(offered_payment__gte=min_price, offered_payment__lte=max_price)

        return [ServiceSchema.from_model(service).dict() for service in services]
    
    
    def search_completed_services(self, request, search_criteria: dict) -> list:
        services = Service.objects.filter(
            location__icontains=search_criteria.get("location", ""),
            state="completed"
        )

        if "tags" in search_criteria:
            services = services.filter(tags__name__in=search_criteria["tags"])

        if "duration" in search_criteria and search_criteria["duration"]:
            duration = search_criteria["duration"]
            services = services.filter(estimated_duration__lte=duration)

        if "price_range" in search_criteria and search_criteria["price_range"]:
            min_price, max_price = search_criteria["price_range"]
            services = services.filter(offered_payment__gte=min_price, offered_payment__lte=max_price)

        return [ServiceSchema.from_model(service).dict() for service in services]

        
    def mark_service_completed(self, request, service_id: int) -> dict:
        
        service = get_object_or_404(Service, id=service_id)
        if service.state == "completed":
            raise HttpError(400, "Service is already completed!")

        if request.user != service.user:
            raise HttpError(403, "Only the creator can mark this service as completed.")


        if service.state == "completed":
            raise HttpError(400, "Service is already completed!")
        
        print(f"Checking creator badges for {service.user.email}")


        service.state = "completed"
        service.save()

        rc = RankController()
        bc = BadgeController()

        rc.add_xp_for_completed_service(service.user_id, is_volunteer=service.is_volunteering)
        
        self.send_notification(
            service.user,
            "XP Earned!",
            f"You earned XP for completing your service '{service.title}' 🎉",
            data={"type": "xp_earned", "service_id": service.id}
        )

        
        bc.check_and_assign_all_badges(service.user)


        for applicant in service.applicants:
            if applicant.get("applicant_state") == "accepted":
                try:
                    user = CustomUser.objects.get(id=applicant["user_id"])

                    rc.add_xp_for_completed_service(user.id, is_volunteer=service.is_volunteering)
                    
                    self.send_notification(
                    user,
                    "XP Earned!",
                    f"You earned XP for completing the service '{service.title}' 🎉",
                    data={"type": "xp_earned", "service_id": service.id}
                )


                    bc.check_and_assign_all_badges(user)


                    if user.referred_by:
                        completed_count = Service.objects.filter(
                            applicants__contains=[{"user_id": user.id, "applicant_state": "accepted"}],
                            state="completed"
                        ).count()

                        #if completed_count == 1:
                            #rc.add_xp_for_referral(user.referred_by.id)

                    self.send_notification(
                        user,
                        "Service Completed",
                        f"The service '{service.title}' you participated in is now marked as completed.",
                        data={"type": "service_completed", "service_id": service.id}
                    )

                except CustomUser.DoesNotExist:
                    print(f"Applicant with ID {applicant['user_id']} not found")

        return {"message": f"Service '{service.title}' marked as completed!"}

        
    def get_progress_status_of_service(self, request, service_id: int) -> dict:
            service = get_object_or_404(Service, id=service_id, user=request.user)
            return {"state": service.state}
        
    def get_list_of_applicants_with_their_states(self, request, service_id: int) -> dict:
        service = get_object_or_404(Service, id=service_id)
        res = {}
        for applicant in service.applicants:
            user = get_user_model().objects.get(id=applicant["user_id"])
            res[user.username] = applicant["applicant_state"]
            
        return res
    
    def get_user_id_by_email(self, request, email: str) -> int: 
        user = get_user_model().objects.get(email=email)
        return {"user_id": user.id}
       
    
    
    def get_list_of_all_user_jobs_with_status(self, request, user_id) -> list:
        services = JobService.objects.filter(user=user_id)
        res = []
        for service in services:
            res.append({'title': service.title, 'state': service.state})
        return res

    def get_list_of_all_user_free_services_with_status(self, request, user_id) -> list:
        services = FreeService.objects.filter(user=user_id)
        res = []
        for service in services:
            res.append({'title': service.title, 'state': service.state})
        return res

    def get_list_of_all_user_volunteering_services_with_status(self, request, user_id) -> list:
        services = VolunteeringService.objects.filter(user=user_id)
        res = []
        for service in services:
            res.append({'title': service.title, 'state': service.state})
        return res

    def get_list_of_all_user_services_with_status(self, request, user_id) -> list:
        res = []
        res.extend(self.get_list_of_all_user_jobs_with_status(request, user_id))
        res.extend(self.get_list_of_all_user_free_services_with_status(request, user_id))
        res.extend(self.get_list_of_all_user_volunteering_services_with_status(request, user_id))
        return res
    
    # def get_list_of_all_completed_services_of_user(self, request, user_id) -> list:
    #     services = Service.objects.filter(user=user_id, state="completed")
    #     res = []
    #     for service in services:
    #         res.append({'title': service.title, 'state': service.state})
    #     return res
    
    
  
    # def get_list_of_all_completed_services_of_user(self, request, user_id) -> list[ServiceSchema]:
    #     services_as_applicant = Service.objects.filter(
    #         state="completed",
    #         applicants__contains=[{"user_id": user_id, "applicant_state": "accepted"}]
    #     )

    #     services_as_creator = Service.objects.filter(user=user_id, state="completed")

    #     all_services = services_as_applicant | services_as_creator
    #     all_services = all_services.distinct()

    #     return [ServiceSchema.from_model(service) for service in all_services]
    
    
    def get_list_of_all_completed_services_of_user(self, request, user_id) -> list[ServiceSchema]:
        created_services = Service.objects.filter(user=user_id, state="completed")
        participated_services = Service.objects.filter(
            applicants__contains=[{"user_id": user_id, "applicant_state": "accepted"}],
            state="completed"
        )
        all_services = (created_services | participated_services).distinct()
        return [ServiceSchema.from_model(service) for service in all_services]

    
        
    def get_applicant_state(self, request, service_id: int) -> dict:
        user= request.user
        
        service= get_object_or_404(Service, id=service_id)

        for applicant in service.applicants:
            if applicant["user_id"] == user.id:
                return {"state": applicant["applicant_state"]}
        raise HttpError(400, f"User '{user.id}' has not applied to this service!")
        
    def get_owner_name(self, service_id: int) -> dict:
        service = get_object_or_404(Service, id=service_id)
        owner = service.user  
        return {"name": owner.profile.name if hasattr(owner, "profile") and owner.profile.name else "Unknown"}
        
    def get_owner_profile(self, service_id: int, request=None) -> dict:
        service = get_object_or_404(Service, id=service_id)
        owner = service.user
        profile = getattr(owner, "profile", None)

        return {
            "name": profile.name if profile and profile.name else "Unknown",
            "image": request.build_absolute_uri(profile.image.url) if profile and profile.image else ""
        }
        
    def get_all_accepted_applicants(self, request, service_id: int) -> list:
        service = get_object_or_404(Service, id=service_id)
        accepted_applicants = []

        for app in service.applicants:
            if app.get("applicant_state") == "accepted":
                try:
                    user = CustomUser.objects.get(id=app["user_id"])
                    accepted_applicants.append({
                        "user_id": user.id,
                        "email": user.email,
                        "name": user.profile.name if hasattr(user, "profile") and user.profile and user.profile.name else None,
                        "applicant_state": app["applicant_state"]
                    })
                except CustomUser.DoesNotExist:
                    continue

        return accepted_applicants


    def update_service_state(self, request, service_id: int, new_state: str) -> dict:
        allowed_states = ["pending", "accepted", "inProgress", "completed"]
        if new_state not in allowed_states:
            raise HttpError(400, f"Invalid state '{new_state}'! Allowed states: {', '.join(allowed_states)}")
        
        service = get_object_or_404(Service, id=service_id, user=request.user)
        service.state = new_state
        service.save()
        return {"message": f"Service '{service.title}' state updated to '{new_state}'"}
    
    
    
    def cancel_service(self, request, service_id: int) -> dict:
        service = get_object_or_404(Service, id=service_id, user=request.user)
        if service.state != "pending":
            raise HttpError(400, "Only pending services can be canceled!")
        service.state = "canceled"
        service.save()
        return {"message": f"Service '{service.title}' has been canceled"}

    
    def reject_applicant(self, request, service_id: int, user_id: int) -> dict:
        service = get_object_or_404(Service, id=service_id, user=request.user)
        applicants = service.applicants

        for applicant in applicants:
            if applicant["user_id"] == user_id:
                if applicant["applicant_state"] == "rejected":
                    raise HttpError(400, "Applicant is already rejected!")
                new_user_id = applicant["user_id"]
                new_applicant_state = "rejected"
                applicants.remove(applicant)
                applicants.append({"user_id": new_user_id, "applicant_state": new_applicant_state})
 
                break
        else:
            raise HttpError(400, f"User '{user_id}' has not applied to this service!")

        service.applicants = applicants
        service.save()
        
       
        applicant_user = CustomUser.objects.get(id=user_id)
        
        user = CustomUser.objects.get(id=user_id)

        self.send_notification(
            user,  
            "Application Rejected",
            f"Your application to '{service.title}' has been rejected."
        )


        return {"message": f"Applicant '{user_id}' rejected from service '{service.title}'."}
    
    def accept_applicant(self, request, service_id: int, user_id: int) -> dict:
        service = get_object_or_404(Service, id=service_id, user=request.user)
        applicants = service.applicants

        for applicant in applicants:
            if applicant["user_id"] == user_id:
                if applicant["applicant_state"] == "accepted":
                    raise HttpError(400, "Applicant is already accepted!")
                
                new_user_id = applicant["user_id"]
                new_applicant_state = "accepted"
                applicants.remove(applicant)
                applicants.append({"user_id": new_user_id, "applicant_state": new_applicant_state})
                break
        else:
            raise HttpError(400, f"User '{user_id}' has not applied to this service!")

        service.applicants = applicants
        service.save()
        
        applicant_user = CustomUser.objects.get(id=user_id)
        
        
        user = CustomUser.objects.get(id=user_id)

        self.send_notification(
            user, 
            "Application Accepted",
            f"Your application to '{service.title}' has been accepted."
        )

    
        return {"message": f"Applicant '{user_id}' accepted to service '{service.title}'."}


    def get_all_services(self) -> list[Service]:
        return Service.objects.all()
    
    
     
    def get_service(self, service_id: int) -> Service:
        return get_object_or_404(Service, id=service_id)
    
    def get_requested_user_services(self, request) -> list[Service]:
        return Service.objects.filter(user=request.user, service_from="publisher")
        

    def get_requested_other_user_services(self , request) -> list[Service]:
        return Service.objects.filter(service_from="publisher").exclude(user=request.user)

    
    def get_offered_user_services(self, request) -> list[Service]:
        return Service.objects.filter(user=request.user, service_from="provider")

    
    def get_offered_other_user_services(self, request) -> list[Service]:
        return Service.objects.filter(service_from="provider").exclude(user=request.user)
    
    
   
    def save_service(self, request, service_id: int) -> dict:
        user = request.user
        service = get_object_or_404(Service, id=service_id)
        
        saved_service_data = {"id": service.id, "title": service.title, "state": service.state}
        
        for saved_service in user.saved_services:
            if saved_service["id"] == service.id:
                saved_service["title"] = service.title
                saved_service["state"] = service.state
                user.save()
                return {"message": f"Service '{service.title}' updated successfully!"}
        
        user.saved_services.append(saved_service_data)
        user.save()
        return {"message": f"Service '{service.title}' saved successfully!"}
    

    def unsave_service(self, request, service_id: int) -> dict:
        user = request.user
        service = get_object_or_404(Service, id=service_id)
        
        saved_service_data = {"id": service.id, "title": service.title, "state": service.state}
        
        for saved_service in user.saved_services:
            if saved_service["id"] == service.id:
                user.saved_services.remove(saved_service)
                user.save()
                return {"message": f"Service '{service.title}' removed from saved services!"}
        
        raise HttpError(400, f"Service '{service.title}' is not saved!")
    
    
    

    def get_services_by_tag(self, tag_name: str) -> list[Service]:
        tag = get_object_or_404(Tag, name=tag_name)
        return Service.objects.filter(tags=tag)
    
    def get_services_by_title(self, title: str) -> list[Service]:
        return Service.objects.filter(title__icontains=title)

    def get_services_by_location(self, location: str) -> list[Service]:
        return Service.objects.filter(location__icontains=location)

    def get_services_by_duration(self, duration: str) -> list[Service]:
        return Service.objects.filter(estimated_duration__lte=duration)

    def get_services_by_state(self, state: str) -> list[Service]:
        return Service.objects.filter(state=state)
    
    def get_service_info_for_sharing(self, service_id: int, user) -> dict:
        service = get_object_or_404(Service, id=service_id)
        user_name = getattr(user.profile, "name", user.username)


        return {
            "shared_by": user_name,
            "title": service.title,
            "description": service.description,
            "location": service.location,
            "date_time_range": service.date_time_range,
            "estimated_duration": service.estimated_duration,
            "offered_payment": service.offered_payment,
            "state": service.state,
            "tags": [tag.name for tag in service.tags.all()],
        }

        



    def get_published_service_by_user_id(self, user_id: int) -> list[Service]:
        return Service.objects.filter(user__id=user_id , service_from="publisher")
    
    
    def get_services_by_provider(self, provider_id: int) -> list[Service]:
        return Service.objects.filter(user__id=provider_id, service_from="provider")
    

    def get_services_by_applicant(self, applicant_id: int) -> list[Service]:
        services = Service.objects.filter(
            applicants__contains=[{"user_id": applicant_id}]
        )
        return services

    def get_services_by_date_time_range(self, date_time_range: list[str]) -> list[Service]:
        return Service.objects.filter(date_time_range=date_time_range)
    
    def get_all_free_services(self) -> list[Service]:
        return FreeService.objects.all()
    
    def get_all_job_services(self) -> list[Service]:
        return JobService.objects.all()
    
    def get_all_volunteering_services(self) -> list[Service]:
        return VolunteeringService.objects.all()
    
    
    def get_completed_services_of_user(self, user_id: Optional[int] = None) -> list[Service]:
        if user_id:
            return Service.objects.filter(state="completed", user__id=user_id)
        return Service.objects.filter(state="completed")

 

    def validate_users_worked_together(self, user_id: int, participant_id: int) -> bool:
        completed_services = Service.objects.filter(state="completed", user_id=user_id)

        for service in completed_services:
            for applicant in service.applicants:
                if applicant["user_id"] == participant_id and applicant["applicant_state"] == "accepted":
                    return True

        return False
