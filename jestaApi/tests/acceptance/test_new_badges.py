import pytest
import json
from new_badges.models import Badge
from users.models import CustomUser, Profile

@pytest.mark.django_db
class TestBadgeRoutes:

    def test_add_and_get_badge(self, client):
        """
        Should be able to create a badge and retrieve it by ID
        """
        
        payload = {"name": "TestBadge", "description": "desc", "image": "http://img"}
        res = client.post("/api/badges/add_badge", data=json.dumps(payload), content_type="application/json")
        assert res.status_code == 201
        badge_id = res.json()["id"]

        res = client.get(f"/api/badges/get_badge/{badge_id}/")
        assert res.status_code == 200
        data = res.json()
        assert data["name"] == "TestBadge"

    def test_get_badge_invalid_id(self, client):
        """
        Getting a badge with invalid ID should return 404
        """
        
        res = client.get("/api/badges/get_badge/9999/")
        assert res.status_code == 404

    def test_add_duplicate_badge(self, client):
        """
        Adding a badge with a duplicate name should fail
        """
        
        Badge.objects.create(name="DupBadge")
        payload = {"name": "DupBadge"}
        res = client.post("/api/badges/add_badge", data=json.dumps(payload), content_type="application/json")
        assert res.status_code == 400
        msg = res.json().get("message") or res.json().get("detail") or res.json().get("msg", "")
        assert "already exists" in msg

    def test_add_badge_missing_name(self, client):
        """
        Adding a badge with missing name should fail
        """
        
        payload = {"description": "desc"}
        res = client.post("/api/badges/add_badge", data=json.dumps(payload), content_type="application/json")
        assert res.status_code == 422

    def test_edit_and_remove_badge(self, client):
        """
        Editing a badge should succeed; removing it should delete it
        """
        
        badge = Badge.objects.create(name="EditBadge", description="old", image="http://old")
        payload = {"name": "Edited", "description": "newdesc", "image": "http://img"}
        res = client.put(
            f"/api/badges/edit_badge/{badge.id}/",
            data=json.dumps(payload),
            content_type="application/json"
        )
        assert res.status_code == 200
        assert res.json()["name"] == "Edited"

        res = client.delete(f"/api/badges/remove_badge/{badge.id}/")
        assert res.status_code == 200
        assert not Badge.objects.filter(id=badge.id).exists()

    def test_edit_badge_invalid_id(self, client):
        """
        Editing a non-existent badge should return 404
        """
        
        payload = {"name": "Whatever"}
        res = client.put("/api/badges/edit_badge/9999/", data=json.dumps(payload), content_type="application/json")
        assert res.status_code == 404

    def test_remove_badge_invalid_id(self, client):
        """
        Removing a non-existent badge should return 404
        """
        
        res = client.delete("/api/badges/remove_badge/9999/")
        assert res.status_code == 404

    def test_get_all_badges(self, client):
        """
        Should return all badges
        """
        
        Badge.objects.create(name="Badge1")
        Badge.objects.create(name="Badge2")
        res = client.get("/api/badges/get_all_badges")
        assert res.status_code == 200
        names = [b["name"] for b in res.json()]
        assert "Badge1" in names and "Badge2" in names

    def test_get_badge_by_name(self, client):
        """
        Should return badge by name
        """
        
        Badge.objects.create(name="ByName", description="d", image="img")
        res = client.get("/api/badges/get_badge_by_name/ByName/")
        assert res.status_code == 200
        assert res.json()["name"] == "ByName"

    def test_get_badge_by_name_invalid(self, client):
        """
        Getting a badge by invalid name should return 404
        """
        
        res = client.get("/api/badges/get_badge_by_name/NoSuchBadge/")
        assert res.status_code == 404

    def test_get_badges_of_user(self, client):
        """
        Should return all badges associated with a user
        """
        
        user = CustomUser.objects.create_user(username="user2", email="user2@test.com", password="pw")
        profile = Profile.objects.create(user=user)
        b1 = Badge.objects.create(name="B11")
        b2 = Badge.objects.create(name="B22")
        profile.badges.add(b1, b2)

        res = client.get(f"/api/badges/get_badges/{user.id}/")
        assert res.status_code == 200
        badge_names = [b["name"] for b in res.json()]
        assert "B11" in badge_names and "B22" in badge_names

    def test_get_badges_of_invalid_user(self, client):
        """
        Getting badges of a non-existent user should return 404
        """
        
        res = client.get("/api/badges/get_badges/9999/")
        assert res.status_code == 404
