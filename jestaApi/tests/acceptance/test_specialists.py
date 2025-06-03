import pytest
import json
from django.contrib.auth import get_user_model
from specialists.models import Specialist
from tags.models import SpecialistTag

User = get_user_model()

@pytest.mark.django_db
class TestSpecialistRoutes:
    def setup_method(self):
        self.user = User.objects.create_user(username="specuser", email="spec@example.com", password="pw")
        self.other_user = User.objects.create_user(username="other", email="other@example.com", password="pw")
        self.tag1 = SpecialistTag.objects.create(name="Python")
        self.tag2 = SpecialistTag.objects.create(name="React")

    def test_create_specialist_success(self, client):
        """
        UC: Successfully create a specialist profile with valid data and existing tags
        """
        
        client.force_login(self.user)
        payload = {
            "service_tags": ["Python", "React"],
            "description": "I build APIs.",
            "portfolio_link": "https://github.com/specuser",
            "location_range": "Tel Aviv",
            "price_range": {"min": 50, "max": 200}
        }
        res = client.post(
            "/api/specialists/create_specialist",
            data=json.dumps(payload),
            content_type="application/json"
        )
        assert res.status_code in (200, 201), f"status={res.status_code}, content={res.content}"
        data = res.json()
        assert data["user"] == self.user.id
        assert set(data["service_tags"]) == {"Python", "React"}
        assert data["description"] == "I build APIs."

    def test_create_specialist_duplicate_error(self, client):
        """
        UC: Creating a second specialist profile for same user should fail
        """
        
        client.force_login(self.user)
        Specialist.objects.create(user=self.user, description="X")
        self.user.refresh_from_db()
        payload = {
            "service_tags": ["Python"],
            "description": "Second try"
        }
        res = client.post(
            "/api/specialists/create_specialist",
            data=json.dumps(payload),
            content_type="application/json"
        )
        assert res.status_code == 422, f"Expected 422 due to validation, got {res.status_code}"

    def test_create_specialist_tag_not_found(self, client):
        """
        UC: Creating a specialist with an invalid tag should return 422
        """
        
        client.force_login(self.other_user)
        payload = {
            "service_tags": ["UnknownTag"],
            "description": "Should fail"
        }
        res = client.post(
            "/api/specialists/create_specialist",
            data=json.dumps(payload),
            content_type="application/json"
        )
        assert res.status_code == 422, f"Expected 422 due to tag not found, got {res.status_code}"

    def test_create_specialist_missing_fields(self, client):
        """
        UC: Creating a specialist without description or tags should fail
        """
        
        client.force_login(self.other_user)
        res = client.post(
            "/api/specialists/create_specialist",
            data=json.dumps({}),
            content_type="application/json"
        )
        assert res.status_code in (400, 422)

    def test_update_specialist(self, client):
        """
        UC: Updating an existing specialist's information should work
        """
        
        specialist = Specialist.objects.create(user=self.user, description="Old desc")
        specialist.service_tags.set([self.tag1, self.tag2])
        client.force_login(self.user)
        payload = {
            "description": "New desc",
            "portfolio_link": "https://updated.com",
            "location_range": "Haifa",
            "price_range": {"min": 80, "max": 180}
        }
        res = client.post(
            "/api/specialists/update_specialist",
            data=json.dumps(payload),
            content_type="application/json"
        )
        assert res.status_code == 200, f"status={res.status_code}, content={res.content}"
        data = res.json()
        assert data["description"] == "New desc"
        assert data["portfolio_link"] == "https://updated.com"
        assert data["location_range"] == "Haifa"
        assert data["price_range"]["min"] == 80
        assert data["price_range"]["max"] == 180

    def test_get_specialist(self, client):
        """
        UC: Retrieve a specialist by user ID
        """
        
        specialist = Specialist.objects.create(user=self.user, description="Desc")
        specialist.service_tags.set([self.tag1])
        res = client.get(f"/api/specialists/get_specialist/{self.user.id}/")
        assert res.status_code == 200
        data = res.json()
        assert data["user"] == self.user.id
        assert data["description"] == "Desc"
        assert data["service_tags"] == ["Python"]

    def test_get_specialist_invalid_user(self, client):
        """
        UC: Try to retrieve specialist for a non-existent user
        """
        
        res = client.get("/api/specialists/get_specialist/9999/")
        assert res.status_code == 404

    def test_get_all_specialists(self, client):
        """
        UC: Fetch all specialists
        """
        
        s1 = Specialist.objects.create(user=self.user, description="One")
        s1.service_tags.set([self.tag1])
        s2 = Specialist.objects.create(user=self.other_user, description="Two")
        s2.service_tags.set([self.tag2])
        res = client.get("/api/specialists/get_all_specialists")
        assert res.status_code == 200
        names = [d["description"] for d in res.json()]
        assert "One" in names
        assert "Two" in names

    def test_get_specialist_by_tag(self, client):
        """
        UC: Fetch specialists by a specific tag name
        """
        
        s1 = Specialist.objects.create(user=self.user, description="Dev")
        s1.service_tags.set([self.tag1])
        res = client.get(f"/api/specialists/get_specialist_by_tag/{self.tag1.name}/")
        assert res.status_code == 200
        data = res.json()
        assert len(data) == 1
        assert data[0]["description"] == "Dev"

    def test_get_specialist_by_location_range(self, client):
        """
        UC: Fetch specialists by their location_range field
        """
        
        s1 = Specialist.objects.create(user=self.user, description="Dev", location_range="Haifa")
        s1.service_tags.set([self.tag1])
        res = client.get("/api/specialists/get_specialist_by_location_range/Haifa/")
        assert res.status_code == 200
        data = res.json()
        assert any(d["description"] == "Dev" for d in data)

    def test_get_specialist_by_price_range(self, client):
        """
        UC: Fetch specialists whose price range includes a target value
        """
        
        s1 = Specialist.objects.create(user=self.user, description="Dev", price_range={"min": 60, "max": 100})
        s1.service_tags.set([self.tag1])
        res = client.get("/api/specialists/get_specialist_by_price_range/70")
        assert res.status_code == 200
        data = res.json()
        assert any(d["description"] == "Dev" for d in data)
