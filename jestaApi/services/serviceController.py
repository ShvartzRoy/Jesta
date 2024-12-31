from django.shortcuts import get_object_or_404
from .models import Service, JobService, FreeService, VolunteeringService, Tag
from .schemas import ServiceCreateSchema
from ninja.errors import HttpError


class ServiceController:
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
            raise HttpError(400, "Invalid service type!")

        service.tags.set(tags)
        return service

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

    def delete_service(self, request, service_id: int) -> dict:
        service = get_object_or_404(Service, id=service_id)
        if service.publisher != request.user:
            raise HttpError(403, "You do not have permission to delete this service!")
        service.delete()
        return {"message": "Service deleted"}
