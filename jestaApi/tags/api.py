from ninja import Router
from .tagController import TagController
from .schemas import TagSchema, TagCreateSchema, TagListSchema, SpecialistTagCreateSchema, SpecialistTagSchema, CategoryCreateSchema, CategorySchema, CategoryListSchema

router = Router(tags=["Tags"])
tag_controller = TagController()

@router.post("/add_tag", response={201: dict, 400: dict})
def add_tag(request, payload: TagCreateSchema):
    tag = tag_controller.add_tag(payload.name, payload.category_id)
    return 201, tag


@router.delete("/remove_tag/{tag_id}/", response={200: dict, 404: dict})
def remove_tag(request, tag_id: int):
    return tag_controller.remove_tag(tag_id)

@router.put("/edit_tag/{tag_id}/", response={200: TagSchema, 404: dict})
def edit_tag(request, tag_id: int, payload: TagCreateSchema):
    return tag_controller.edit_tag(tag_id, payload.name)

@router.get("/get_all_tags", response={200: TagListSchema})
def get_all_tags(request):
    tags = tag_controller.get_all_tags()
    return {"tags": tags}


@router.get("/get_tag/{tag_id}/", response={200: TagSchema, 404: dict})
def get_tag(request, tag_id: int):
    return tag_controller.get_tag(tag_id)

@router.get("/get_tag_by_name/{name}/", response={200: TagSchema, 404: dict})
def get_tag_by_name(request, name: str):
    return tag_controller.get_tag_by_name(name)

@router.post("/add_specialist_tag", response={201: dict, 400: dict})
def add_specialist_tag(request, payload: SpecialistTagCreateSchema):
    specialist_tag = tag_controller.add_specialist_tag(payload.name, payload.category_id)
    return 201, specialist_tag


@router.delete("/remove_specialist_tag/{specialist_tag_id}/", response={200: dict, 404: dict})
def remove_specialist_tag(request, specialist_tag_id: int):
    return tag_controller.remove_specialist_tag(specialist_tag_id)


# Category Endpoints
@router.post("/add_category", response={201: CategorySchema, 400: dict})
def add_category(request, payload: CategoryCreateSchema):
    return 201, tag_controller.add_category(payload.name)


@router.post("/add_tag_to_category/{category_id}/{tag_id}/", response={200: dict, 404: dict})
def add_tag_to_category(request, category_id: int, tag_id: int):
    return tag_controller.add_tag_to_category(category_id, tag_id)


@router.post("/add_specialist_tag_to_category/{category_id}/{specialist_tag_id}/", response={200: dict, 404: dict})
def add_specialist_tag_to_category(request, category_id: int, specialist_tag_id: int):
    return tag_controller.add_specialist_tag_to_category(category_id, specialist_tag_id)


@router.delete("/remove_tag_from_category/{category_id}/{tag_id}/", response={200: dict, 404: dict})
def remove_tag_from_category(request, category_id: int, tag_id: int):
    return tag_controller.remove_tag_from_category(category_id, tag_id)


@router.delete("/remove_specialist_tag_from_category/{category_id}/{specialist_tag_id}/", response={200: dict, 404: dict})
def remove_specialist_tag_from_category(request, category_id: int, specialist_tag_id: int):
    return tag_controller.remove_specialist_tag_from_category(category_id, specialist_tag_id)


@router.get("/get_categories", response={200: CategoryListSchema})
def get_categories(request):
    categories = tag_controller.get_categories()
    return {"categories": categories}


@router.get("/get_category_by_tag_id/{tag_id}/", response={200: CategoryListSchema, 404: dict})
def get_category_by_tag_id(request, tag_id: int):
    categories = tag_controller.get_category_by_tag_id(tag_id)
    return {"categories": categories}


@router.get("/get_category_by_specialist_tag_id/{specialist_tag_id}/", response={200: CategoryListSchema, 404: dict})
def get_category_by_specialist_tag_id(request, specialist_tag_id: int):
    categories = tag_controller.get_category_by_specialist_tag_id(specialist_tag_id)
    return {"categories": categories}
