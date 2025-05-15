from django.test import TestCase
from notifications.models import Notification
from users.models import CustomUser

class NotificationModelTest(TestCase):
    def setUp(self):
        Notification.objects.all().delete()
        self.user = CustomUser.objects.create_user(username="notifyuser", email="notify@example.com", password="pass123")

    def test_create_notification(self):
        notif = Notification.objects.create(
            user=self.user,
            title="New Message",
            body="You have a new message.",
            data={"type": "message", "id": 1}
        )
        self.assertEqual(notif.title, "New Message")
        self.assertEqual(notif.read, False)
        self.assertEqual(str(notif), f"To {self.user.email} - New Message")
        self.assertIn("type", notif.to_dict()["data"])
        self.assertEqual(notif.to_dict()["data"]["type"], "message")
