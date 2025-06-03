import pytest
from django.contrib.auth import get_user_model
from notifications.models import Notification

User = get_user_model()

@pytest.mark.django_db
class TestNotificationRoutes:
    def setup_method(self):
        self.user = User.objects.create_user(username="notuser", email="notuser@example.com", password="pw")
        self.other = User.objects.create_user(username="other", email="other@example.com", password="pw")

    def _create_notifications(self, user, n=3):
        """
        Helper to create n notifications for a given user.
        """
        
        notes = []
        for i in range(n):
            notes.append(Notification.objects.create(
                user=user,
                title=f"Test Note {i}",
                body=f"Body {i}",
                data={"foo": i}
            ))
        return notes

    def test_get_user_notifications(self, client):
        """
        User can retrieve their notifications (regardless of read status).
        """
        
        self._create_notifications(self.user, 5)
        client.force_login(self.user)
        res = client.get("/api/notifications/get_user_notifications")
        assert res.status_code == 200
        data = res.json()
        assert len(data) == 5
        for note in data:
            assert note["title"].startswith("Test Note")
            assert note["read"] is False

    def test_get_user_notifications_unauthenticated(self, client):
        """
        Anonymous users should not be able to fetch notifications.
        """
        
        res = client.get("/api/notifications/get_user_notifications")
        assert res.status_code == 500

    def test_get_unread_notifications(self, client):
        """
        Only unread notifications should be returned.
        """
        
        notes = self._create_notifications(self.user, 2)
        notes[0].read = True
        notes[0].save()
        client.force_login(self.user)
        res = client.get("/api/notifications/get_unread")
        assert res.status_code == 200
        data = res.json()
        assert all(n["read"] is False for n in data)
        assert len(data) == 1

    def test_mark_as_read(self, client):
        """
        User can mark their own notification as read.
        """
        
        note = Notification.objects.create(
            user=self.user, title="X", body="Y", data={}
        )
        client.force_login(self.user)
        res = client.post(f"/api/notifications/mark_as_read/{note.id}")
        assert res.status_code == 200
        note.refresh_from_db()
        assert note.read is True
        assert "Notification marked as read" in res.json().get("message", "")

    def test_mark_as_read_invalid_id(self, client):
        """
        Trying to mark a non-existent notification as read should fail.
        """
        
        client.force_login(self.user)
        res = client.post("/api/notifications/mark_as_read/999999")
        assert res.status_code == 404

    def test_mark_as_read_forbidden(self, client):
        """
        User cannot mark another user's notification as read.
        """
        
        note = Notification.objects.create(
            user=self.other, title="X", body="Y", data={}
        )
        client.force_login(self.user)
        res = client.post(f"/api/notifications/mark_as_read/{note.id}")
        assert res.status_code == 404

    def test_get_latest(self, client):
        """
        Get latest notifications returns recent ones with timestamps.
        """
        
        self._create_notifications(self.user, 4)
        client.force_login(self.user)
        res = client.get("/api/notifications/get_latest")
        assert res.status_code == 200
        data = res.json()["notifications"]
        assert len(data) <= 4
        for n in data:
            assert "created_at" in n

    def test_mark_all_as_read(self, client):
        """
        All notifications should be marked as read for the user.
        """
        
        self._create_notifications(self.user, 2)
        client.force_login(self.user)
        res = client.post("/api/notifications/mark_all_as_read")
        assert res.status_code == 200
        assert "All notifications marked as read" in res.json().get("message", "")
        unread = Notification.objects.filter(user=self.user, read=False)
        assert unread.count() == 0

    def test_mark_all_as_read_unauthenticated(self, client):
        """
        Anonymous users cannot mark all notifications as read.
        """
        
        res = client.post("/api/notifications/mark_all_as_read")
        assert res.status_code == 500
