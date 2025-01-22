from ninja import Router
from .schemas import SpecialistSchema, SpecialistCreateSchema
from .specialistsController import SpecialistController

router = Router(tags=["Specialists"])
sc = SpecialistController()


@router.post("/create_specialist", response={201: SpecialistSchema, 200: SpecialistSchema, 401: dict, 400: dict})
def create_specialist(request, payload: SpecialistCreateSchema):
    return sc.create_specialist(request, payload)



@router.put("/update_specialist", response={200: SpecialistSchema, 404: dict})
def update_specialist(request, payload: SpecialistCreateSchema):
    return sc.update_specialist(request, payload)


@router.delete("/delete_specialist", response={200: dict, 404: dict})
def delete_specialist(request):
    return sc.delete_specialist(request)


@router.get("/get_specialist/{user_id}/", response={200: SpecialistSchema, 404: dict})
def get_specialist(request, user_id: int):
    return sc.get_specialist(user_id)


@router.get("/get_all_specialists", response={200: list[SpecialistSchema]})
def get_all_specialists(request):
    return sc.get_all_specialists(request)


@router.get("/get_specialist_by_tag/{tag}/", response={200: list[SpecialistSchema], 404: dict})
def get_specialist_by_tag(request, tag: str):
    return sc.get_specialist_by_tag(tag)


@router.get("/get_specialist_by_location_range/{location}/", response={200: list[SpecialistSchema]})
def get_specialist_by_location_range(request, location: str):
    return sc.get_specialist_by_location_range(location)


@router.get("/get_specialist_by_price_range/{price}", response={200: list[SpecialistSchema]})
def get_specialist_by_price_range(request, price: int):
    return sc.get_specialist_by_price_range(price)


@router.get("/get_specialist_by_user_id/", response={200: SpecialistSchema, 404: dict})
def get_specialist_by_user_id(request):
    return sc.get_specialist_by_user_id(request.user.id)
