from django.shortcuts import get_object_or_404
from .models import Service, JobService, FreeService, VolunteeringService
from .schemas import ServiceCreateSchema
from tags.models import Tag
from ninja.errors import HttpError


class ServiceController:
    
    
    #for publishers: 
    def create_service(self, request, payload: ServiceCreateSchema) -> Service:
        tags = []
        for tag_name in payload.tags:
            tag, created = Tag.objects.get_or_create(name=tag_name)
            tags.append(tag)

        if payload.type == "job":
            service = JobService.objects.create(
                publisher=request.user,
                title=payload.title,
                description=payload.description,
                location=payload.location,
                date_time_range=payload.date_time_range,
                estimated_duration=payload.estimated_duration,
                offered_payment=payload.offered_payment,
                state="pending"

            )
            
        elif payload.type == "free":
            service = FreeService.objects.create(
                publisher=request.user,
                title=payload.title,
                description=payload.description,
                location=payload.location,
                date_time_range=payload.date_time_range,
                estimated_duration=payload.estimated_duration,
                state="pending"

            )
            
            
        elif payload.type == "volunteering":
            service = VolunteeringService.objects.create(
                publisher=request.user,
                title=payload.title,
                description=payload.description,
                location=payload.location,
                date_time_range=payload.date_time_range,
                estimated_duration=payload.estimated_duration,
                state="pending"
            )
            
        else:
            raise HttpError(400, "Invalid service type!")

        service.tags.set(tags)
        return service
    
    def delete_service(self, request, service_id: int) -> dict:
        service = get_object_or_404(Service, id=service_id)
        if service.publisher != request.user:
            raise HttpError(403, "You do not have permission to delete this service!")
        service.delete()
        return {"message": "Service deleted"}
    
    
    
    #for providers:
    def offer_as_provider(self, request, payload: ServiceCreateSchema) -> Service:
        tags = []
        for tag_name in payload.tags:
            tag, created = Tag.objects.get_or_create(name=tag_name)
            tags.append(tag)

        if payload.type == "job":
            service = JobService.objects.create(
                publisher=request.user,
                title=payload.title,
                description=payload.description,
                location=payload.location,
                date_time_range=payload.date_time_range,
                estimated_duration=payload.estimated_duration,
                offered_payment=payload.offered_payment 
            )
            
        elif payload.type == "free":
            service = FreeService.objects.create(
                publisher=request.user,
                title=payload.title,
                description=payload.description,
                location=payload.location,
                date_time_range=payload.date_time_range,
                estimated_duration=payload.estimated_duration
            )
            
        elif payload.type == "volunteering":
            service = VolunteeringService.objects.create(
                publisher=request.user,
                title=payload.title,
                description=payload.description,
                location=payload.location,
                date_time_range=payload.date_time_range,
                estimated_duration=payload.estimated_duration
            )
        else:
            raise HttpError(400, "Invalid service type! Please specify- 'job', 'free', or 'volunteering'!")

        service.tags.set(tags)
        return service


    def get_service(self, service_id: int) -> Service:
        return get_object_or_404(Service, id=service_id)
    
    

    def get_applied_service_by_user_id(self, user_id: int) -> list[Service]:
        return Service.objects.filter(applicants__id=user_id)
    
    

    def get_saved_service_by_user_id(self, user_id: int) -> list[Service]:
        return Service.objects.filter(saved_users__id=user_id)
    
    

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
