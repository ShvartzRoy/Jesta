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


class ServiceController:
    
    
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
                
        else:
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
        service.delete()
        return {"message": "Service deleted"}
    



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
        if request.user in service.applicants:
            raise HttpError(400, "You have already applied to this service!")
        
        if service.state != "pending" and service.state != "accepted":
            raise HttpError(400, "Service is not available for application!")
        
        service.applicants.append({"user_id": request.user.id, "applicant_state": "pending"})
        service.save()
        return {"message": "Application successful!"}
    
   


    def remove_from_service(self, request, service_id: int) -> dict:
        service = get_object_or_404(Service, id=service_id)
        applicants = service.applicants

        for applicant in applicants:
            if applicant["user_id"] == request.user.id:
                applicants.remove(applicant)
                break
        else:
            raise HttpError(400, "You have not applied to this service!")

        service.applicants = applicants
        service.save()
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
        service = get_object_or_404(Service, id=service_id, user=request.user)
        service.state = "completed"
        service.save()
        
        return {"message": f"Service '{service.title}' marked as completed!"}



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
                applicant["applicant_state"] = "rejected"
                break
        else:
            raise HttpError(400, f"User '{user_id}' has not applied to this service!")

        service.applicants = applicants
        service.save()
        return {"message": f"Applicant '{user_id}' rejected from service '{service.title}'."}
    
    def accept_applicant(self, request, service_id: int, user_id: int) -> dict:
        service = get_object_or_404(Service, id=service_id, user=request.user)
        applicants = service.applicants

        for applicant in applicants:
            if applicant["user_id"] == user_id:
                if applicant["applicant_state"] == "accepted":
                    raise HttpError(400, "Applicant is already accepted!")
                applicant["applicant_state"] = "accepted"
                break
        else:
            raise HttpError(400, f"User '{user_id}' has not applied to this service!")

        service.applicants = applicants
        service.save()
        return {"message": f"Applicant '{user_id}' accepted to service '{service.title}'."}


    def get_all_services(self) -> list[Service]:
        return Service.objects.all()
    
    
     
    def get_service(self, service_id: int) -> Service:
        return get_object_or_404(Service, id=service_id)
    
    def get_requested_services(self):
        return Service.objects.filter(service_from="publisher")

    def get_offered_services(self):
        return Service.objects.filter(service_from="provider")
    

   
    # def get_saved_service_by_user_id(self, user_id: int) -> list[Service]:
    #     return Service.objects.filter(saved_users__id=user_id)
    
    

    def get_services_by_tag(self, tag_name: str) -> list[Service]:
        tag = get_object_or_404(Tag, name=tag_name)
        return Service.objects.filter(tags=tag)

    def get_services_by_location(self, location: str) -> list[Service]:
        return Service.objects.filter(location__icontains=location)

    def get_services_by_duration(self, duration: str) -> list[Service]:
        return Service.objects.filter(estimated_duration__lte=duration)

    def get_services_by_state(self, state: str) -> list[Service]:
        return Service.objects.filter(state=state)



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
