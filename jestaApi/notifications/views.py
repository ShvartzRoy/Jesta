from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_all_as_read(request):
    user = request.user
    user.notifications.filter(read=False).update(read=True)
    return Response({"message": "All notifications marked as read."})
