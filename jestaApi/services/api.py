from ninja import Router

router = Router(tags=["service"])

@router.get("/")
def get_service(request):
    return {"test": "success"}
