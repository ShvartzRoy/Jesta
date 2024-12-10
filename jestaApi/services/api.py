from ninja import Router

router = Router()

@router.get("/")
def get_service(request):
    return {"test": "success"}
