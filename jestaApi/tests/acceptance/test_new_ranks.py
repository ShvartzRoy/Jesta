import pytest
import json
from django.contrib.auth import get_user_model
from new_ranks.models import Rank
from new_badges.models import Badge
from users.models import Profile

User = get_user_model()

@pytest.mark.django_db
class TestRankRoutes:
    def setup_method(self):
        self.pw = "pw123"
        self.user = User.objects.create_user(username="x", email="x@example.com", password=self.pw)
        self.user2 = User.objects.create_user(username="y", email="y@example.com", password=self.pw)
        Profile.objects.create(user=self.user)
        Profile.objects.create(user=self.user2)

    def test_create_rank_invalid_user(self, client):
        """
        User cannot create a rank for someone else.
        """
        
        client.force_login(self.user)
        payload = {"user_id": self.user2.id, "xp": 123, "level": 2, "badges": []}
        res = client.post("/api/ranks/create_rank", json=payload)
        assert res.status_code == 422, f"Unexpected: {res.status_code}, {res.content}"

    def test_create_rank_unauthenticated(self, client):
        """
        Rank creation should fail without authentication.
        """
        
        payload = {"user_id": self.user.id, "xp": 123, "level": 2, "badges": []}
        res = client.post("/api/ranks/create_rank", json=payload)
        assert res.status_code == 422

    def test_create_rank_with_negative_xp(self, client):
        """
        Creating a rank with negative XP should fail.
        """
        
        client.force_login(self.user)
        payload = {"user_id": self.user.id, "xp": -1, "level": 1, "badges": []}
        res = client.post("/api/ranks/create_rank", json=payload)
        assert res.status_code == 422

    def test_create_rank_with_negative_level(self, client):
        """
        Creating a rank with negative level should fail.
        """
        
        client.force_login(self.user)
        payload = {"user_id": self.user.id, "xp": 0, "level": -1, "badges": []}
        res = client.post("/api/ranks/create_rank", json=payload)
        assert res.status_code == 422

    def test_create_rank_with_invalid_badges(self, client):
        """
        Creating a rank with badge IDs that do not exist should still succeed but not add badges.
        """
        
        client.force_login(self.user)
        payload = {"user_id": self.user.id, "xp": 100, "level": 2, "badges": [999]}
        res = client.post("/api/ranks/create_rank", json=payload)
        assert res.status_code == 422

    def test_get_rank(self, client):
        """
        Retrieve an existing rank.
        """
        
        client.force_login(self.user)
        rank = Rank.objects.create(user=self.user, xp=42, level=3)
        res = client.get(f"/api/ranks/get_rank/{self.user.id}/")
        assert res.status_code == 200, f"Unexpected status {res.status_code}: {res.content}"
        if res.status_code == 200:
            data = res.json()
            assert data.get("xp") == 42
            assert data.get("level") == 3

    def test_add_xp_and_update_level(self, client):
        """
        Add XP and update level based on new XP total.
        """
        
        client.force_login(self.user)
        rank = Rank.objects.create(user=self.user, xp=450, level=1)
        res = client.post(f"/api/ranks/add_xp/{self.user.id}/?xp=600")
        assert res.status_code == 200, f"Unexpected status {res.status_code}: {res.content}"
        rank.refresh_from_db()
        assert rank.xp == 1050
        res2 = client.get(f"/api/ranks/update_level/{self.user.id}/")
        assert res2.status_code == 200, f"Unexpected status {res2.status_code}: {res2.content}"
        rank.refresh_from_db()
        assert rank.level >= 2

    def test_add_negative_xp(self, client):
        """
        Negative XP addition should be rejected.
        """
        
        Rank.objects.create(user=self.user)
        client.force_login(self.user)
        res = client.post(f"/api/ranks/add_xp/{self.user.id}/?xp=-50")
        assert res.status_code == 400
        msg = res.json().get("detail", "") or res.json().get("msg", "")
        assert "XP cannot be negative" in msg

    def test_add_xp_to_nonexistent_user(self, client):
        """
        Adding XP to a nonexistent user should return 404.
        """
        
        client.force_login(self.user)
        res = client.post(f"/api/ranks/add_xp/999999/?xp=100")
        assert res.status_code == 404

    def test_badge_assignment_by_level(self, client):
        """
        Ranks reaching level threshold automatically earn badges.
        """
        
        exp_badge, _ = Badge.objects.get_or_create(name="Experienced")
        r = Rank.objects.create(user=self.user, xp=2500, level=4)
        client.force_login(self.user)
        client.post(f"/api/ranks/add_xp/{self.user.id}/?xp=1000")
        client.get(f"/api/ranks/update_level/{self.user.id}/")
        r.refresh_from_db()
        assert any(b.name == "Experienced" for b in r.badges.all())

    def test_get_badges_endpoint(self, client):
        """
        Retrieve all badges associated with a user's rank.
        """
        
        b1 = Badge.objects.create(name="TestBadge1")
        b2 = Badge.objects.create(name="TestBadge2")
        r = Rank.objects.create(user=self.user)
        r.badges.add(b1, b2)
        res = client.get(f"/api/ranks/get_badges/{self.user.id}/")
        assert res.status_code == 200
        names = {b["name"] for b in res.json()}
        assert "TestBadge1" in names and "TestBadge2" in names

    def test_get_xp_and_level(self, client):
        """
        Fetch XP and level values independently.
        """
        
        Rank.objects.create(user=self.user, xp=77, level=1)
        xp_res = client.get(f"/api/ranks/get_xp/{self.user.id}/")
        lvl_res = client.get(f"/api/ranks/get_level/{self.user.id}/")
        assert xp_res.status_code == 200
        assert lvl_res.status_code == 200
        assert xp_res.json() == 77
        assert lvl_res.json() == 1

    def test_get_rank_for_non_existent_user(self, client):
        """
        Trying to get rank for a non-existent user should return 404.
        """
        
        res = client.get("/api/ranks/get_rank/999999/")
        assert res.status_code == 404
        assert "not found" in res.json().get("detail", "").lower() or "not found" in res.json().get("msg", "").lower()
