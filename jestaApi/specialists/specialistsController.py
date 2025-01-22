from django.shortcuts import get_object_or_404
from .models import Specialist
from tags.models import Tag
from ninja.errors import HttpError
from .schemas import SpecialistSchema, SpecialistCreateSchema


class SpecialistController:

    def create_specialist(self, request, payload: SpecialistCreateSchema) -> SpecialistSchema:
        if not request.user.is_authenticated:
            raise HttpError(401, "User is not authenticated!")

        if hasattr(request.user, "specialist_profile"):
            raise HttpError(400, "You are already a specialist for another service!")

        service_tag = get_object_or_404(Tag, name=payload.service_tag)
        specialist = Specialist.objects.create(
            user=request.user,
            service_tag=service_tag,
            description=payload.description,
            portfolio_link=payload.portfolio_link,
            location_range=payload.location_range,
            price_range=payload.price_range,
        )
        
        return SpecialistSchema.from_model(specialist)

    def update_specialist(self, request, payload: SpecialistCreateSchema) -> SpecialistSchema:
        specialist = get_object_or_404(Specialist, user=request.user)

        if payload.service_tag:
            service_tag = get_object_or_404(Tag, name=payload.service_tag)
            specialist.service_tag = service_tag

        if payload.description:
            specialist.description = payload.description

        if payload.portfolio_link:
            specialist.portfolio_link = payload.portfolio_link

        if payload.location_range:
            specialist.location_range = payload.location_range

        if payload.price_range:
            specialist.price_range = payload.price_range

        specialist.save()
        return SpecialistSchema.from_model(specialist)
    
    

    def delete_specialist(self, request) -> dict:
        specialist = get_object_or_404(Specialist, user=request.user)
        specialist.delete()
        return {"msg": "Specialist profile deleted successfully!"}
    

    def get_specialist(self, user_id: int) -> SpecialistSchema:
        specialist = get_object_or_404(Specialist, user_id=user_id)
        return SpecialistSchema.from_model(specialist)
    
    

    def get_all_specialists(self, request) -> list[SpecialistSchema]:
        specialists = Specialist.objects.all()
        return [SpecialistSchema.from_model(s) for s in specialists]
    
    

    def get_specialist_by_tag(self, tag: str) -> list[SpecialistSchema]:
        tag = get_object_or_404(Tag, name=tag)
        specialists = Specialist.objects.filter(service_tag=tag)
        return [SpecialistSchema.from_model(s) for s in specialists]
    

    def get_specialist_by_location_range(self, location: str) -> list[SpecialistSchema]:
        specialists = Specialist.objects.filter(location_range__contains=location)
        return [SpecialistSchema.from_model(s) for s in specialists]
    
    


    def get_specialist_by_price_range(self, price: int) -> list[SpecialistSchema]:
        specialists = Specialist.objects.filter(
            price_range__min__lte=price,
            price_range__max__gte=price
        )
        return [SpecialistSchema.from_model(specialist) for specialist in specialists]


    def get_specialist_by_user_id(self, user_id: int) -> SpecialistSchema:
        specialist = get_object_or_404(Specialist, user_id=user_id)
        return SpecialistSchema.from_model(specialist)
