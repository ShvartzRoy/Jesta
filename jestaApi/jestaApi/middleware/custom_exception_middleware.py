import json
from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin

class CustomExceptionMiddleware(MiddlewareMixin):
    def process_response(self, request, response):
        if response.status_code >= 400 and response.get("Content-Type") == "application/json":
            try:
                data = json.loads(response.content)
                if "detail" in data:
                    return JsonResponse({"msg": data["detail"]}, status=response.status_code)
            except Exception:
                pass  
        return response

    def process_exception(self, request, exception):
        return JsonResponse({"msg": str(exception)}, status=500)
