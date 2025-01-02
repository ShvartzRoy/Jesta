from typing import Optional
from django.conf import settings
from django.shortcuts import get_object_or_404
from .models import Service, JobService, FreeService, VolunteeringService
from .schemas import ServiceCreateSchema
from tags.models import Tag
from ninja.errors import HttpError
from dateutil.parser import isoparse
from datetime import timedelta


class ServiceController:
    
    
    #for publishers: 
    def create_service(self, request, payload):
        if isinstance(payload.estimated_duration, str):
            try:
                payload.estimated_duration = isoparse(payload.estimated_duration) - isoparse("PT0S")
            except ValueError:
                raise HttpError(400, "Invalid estimated duration format. Use ISO 8601, e.g., 'PT50M' for 50 minutes.")

        tags = [Tag.objects.get_or_create(name=tag_name)[0] for tag_name in payload.tags]

        service = Service.objects.create(
            publisher=request.user,
            title=payload.title,
            description=payload.description,
            location=payload.location,
            date_time_range=payload.date_time_range,
            estimated_duration=payload.estimated_duration,
            state="pending",
            service_type=payload.service_type or "publisher", 
        )
        
        service.tags.set(tags)
        return service
    
    

    #for providers:
    def offer_as_provider(self, request, payload):
        tags = [Tag.objects.get_or_create(name=tag_name)[0] for tag_name in payload.tags]

        service = Service.objects.create(
            publisher=request.user,
            title=payload.title,
            description=payload.description,
            location=payload.location,
            date_time_range=payload.date_time_range,
            estimated_duration=payload.estimated_duration,
            service_type="offered",
            state="pending",
        )
        service.tags.set(tags)
        return service

    
    def delete_service(self, request, service_id: int) -> dict:
        service = get_object_or_404(Service, id=service_id)
        if service.publisher != request.user:
            raise HttpError(403, "You do not have permission to delete this service!")
        service.delete()
        return {"message": "Service deleted"}
    
    def get_service(self, service_id: int) -> Service:
        return get_object_or_404(Service, id=service_id)
    
    
  
    def get_requested_services(self):
        return Service.objects.filter(service_type="requested")

    def get_offered_services(self):
        return Service.objects.filter(service_type="offered")
    
    

    def get_applied_service_by_user_id(self, user_id: int) -> list[Service]:
        return Service.objects.filter(applicants__id=user_id)
    
    

    # def get_saved_service_by_user_id(self, user_id: int) -> list[Service]:
    #     return Service.objects.filter(saved_users__id=user_id)
    
    

    def get_published_service_by_user_id(self, user_id: int) -> list[Service]:
        return Service.objects.filter(publisher__id=user_id)


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

    def update_date_time_range(self, service: Service, new_data: dict) -> bool:
        service.date_time_range = new_data
        service.save()
        return True

    def update_estimated_duration(self, service: Service, new_data: str) -> bool:
        service.estimated_duration = new_data
        service.save()
        return True

    def update_offered_payment(self, service: JobService, new_data: float) -> bool:
        if isinstance(service, JobService):
            service.offered_payment = new_data
            service.save()
            return True
        else:
            raise HttpError(400, "This service type does not support payment updates!")
        

    def apply_to_service(self, request, service_id: int) -> dict:
        service = get_object_or_404(Service, id=service_id)
        if request.user in service.applicants.all():
            raise HttpError(400, "You have already applied to this service!")
        service.applicants.add(request.user)
        return {"message": "Application successful!"}
    
    

    def remove_from_service(self, request, service_id: int) -> dict:
        service = get_object_or_404(Service, id=service_id)
        if request.user not in service.applicants.all():
            raise HttpError(400, "You have not applied to this service!")
        service.applicants.remove(request.user)
        return {"message": "Removed from service successfully!"}
    
    

    def get_applicants(self, request, service_id: int) -> list:
        service = get_object_or_404(Service, id=service_id)
        return list(service.applicants.all())
    

    
    #later will make a smarter search!!
    def search_needed_services(self, request, search_criteria) -> list:
        services = Service.objects.filter(
            location__icontains=search_criteria.get("location", ""),
            state="pending"  
        )
        
        if "tags" in search_criteria:
            services = services.filter(tags__name__in=search_criteria["tags"])

        if "duration" in search_criteria:
            services = services.filter(estimated_duration__lte=search_criteria["duration"])

        return services

    def search_providers(self, request, search_criteria) -> list:
        services = JobService.objects.filter(
            location__icontains=search_criteria.get("location", "")
        )

        if "tags" in search_criteria:
            services = services.filter(tags__name__in=search_criteria["tags"])

        if "price_range" in search_criteria:
            services = services.filter(offered_payment__gte=search_criteria["price_range"][0],
                                       offered_payment__lte=search_criteria["price_range"][1])

        return services
    
    
    
    def mark_service_completed(self, request, service_id: int) -> dict:
        service = get_object_or_404(Service, id=service_id, publisher=request.user)
        service.state = "completed"
        service.save()
        return {"message": f"Service '{service.title}' marked as completed!"}

    def cancel_service(self, request, service_id: int) -> dict:
        service = get_object_or_404(Service, id=service_id, publisher=request.user)
        if service.state != "pending":
            raise HttpError(400, "Only pending services can be canceled!")
        service.state = "canceled"
        service.save()
        return {"message": f"Service '{service.title}' has been canceled"}


    def reject_applicant(self, request, service_id: int, user_id: int) -> dict:
        service = get_object_or_404(Service, id=service_id, publisher=request.user)
        applicant = get_object_or_404(settings.AUTH_USER_MODEL, id=user_id)
        if applicant not in service.applicants.all():
            raise HttpError(400, f"User '{applicant}' has not applied to this service!")
        service.applicants.remove(applicant)
        return {"message": f"Applicant '{applicant.email}' rejected from service '{service.title}'."}
    

    def get_all_services(self) -> list[Service]:
        return Service.objects.all()
    
    def get_services_by_tag(self, tag_name: str) -> list[Service]:
        tag = get_object_or_404(Tag, name=tag_name)
        return Service.objects.filter(tags=tag)

    def get_services_by_location(self, location: str) -> list[Service]:
        return Service.objects.filter(location__icontains=location)
    
    def get_services_by_duration(self, duration: str) -> list[Service]:
        return Service.objects.filter(estimated_duration__lte=duration)
    
    
    def get_services_by_state(self, state: str) -> list[Service]:
        return Service.objects.filter(state=state)
    

    def get_services_by_provider(self, provider_id: int) -> list[Service]:
        return Service.objects.filter(applicants__id=provider_id)
    
    def get_services_by_applicant(self, applicant_id: int) -> list[Service]:
        return Service.objects.filter(applicants__id=applicant_id)
    
    def get_services_by_date_time_range(self, date_time_range: list[str]) -> list[Service]:
        return Service.objects.filter(date_time_range=date_time_range)
    
    

    def update_service_state(self, request, service_id: int, new_state: str) -> dict:
        allowed_states = ["pending", "accepted", "inProgress", "completed"]
        if new_state not in allowed_states:
            raise HttpError(400, f"Invalid state '{new_state}'! Allowed states: {', '.join(allowed_states)}")
        
        service = get_object_or_404(Service, id=service_id, publisher=request.user)
        service.state = new_state
        service.save()
        return {"message": f"Service '{service.title}' state updated to '{new_state}'"}
    
    
    def get_completed_services_of_user(self, user_id: Optional[int] = None) -> list[Service]:
        if user_id:
            return Service.objects.filter(state="completed", publisher__id=user_id)
        return Service.objects.filter(state="completed")


    def validate_users_worked_together(self, publisher_id: int, provider_id: int) -> bool:
        completed_services = Service.objects.filter(
            state="completed",
            publisher__id=publisher_id,
            applicants__id=provider_id
        )
        return completed_services.exists()
