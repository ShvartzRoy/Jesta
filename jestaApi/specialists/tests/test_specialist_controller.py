import pytest
from django.test import TestCase, RequestFactory
from users.models import CustomUser
from specialists.models import Specialist
from specialists.specialistsController import SpecialistController
from specialists.schemas import SpecialistCreateSchema, SpecialistUpdateSchema
from tags.models import SpecialistTag


class TestSpecialistController(TestCase):
    def setUp(self):
        self.factory = RequestFactory()
        self.controller = SpecialistController()
        self.user = CustomUser.objects.create_user(
            username="testuser", email="test@example.com", password="testpass"
        )
        self.tag1 = SpecialistTag.objects.create(name="Plumber")
        self.tag2 = SpecialistTag.objects.create(name="Electrician")

    def simulate_request(self):
        request = self.factory.post("/")
        request.user = self.user
        return request

    def test_create_specialist_success(self):
        payload = SpecialistCreateSchema(
            description="Expert in plumbing",
            portfolio_link="http://portfolio.test",
            location_range="Tel Aviv",
            price_range={"min": 50, "max": 150},
            service_tags=["Plumber"],
        )
        request = self.simulate_request()
        result = self.controller.create_specialist(request, payload)
        assert result.description == "Expert in plumbing"
        assert result.portfolio_link == "http://portfolio.test"
        assert self.user.specialist_profile.description == "Expert in plumbing"

    def test_create_specialist_already_exists(self):
        Specialist.objects.create(user=self.user, description="Dup", location_range="X", price_range={"min": 0, "max": 0})
        payload = SpecialistCreateSchema(
            description="Another one",
            portfolio_link="http://link.test",
            location_range="Haifa",
            price_range={"min": 10, "max": 100},
            service_tags=["Plumber"]
        )
        request = self.simulate_request()
        with pytest.raises(Exception):
            self.controller.create_specialist(request, payload)

    def test_update_specialist(self):
        Specialist.objects.create(
            user=self.user,
            description="Initial",
            portfolio_link="http://init.com",
            location_range="North",
            price_range={"min": 10, "max": 100}
        )
        payload = SpecialistUpdateSchema(
            description="Updated Desc",
            portfolio_link="http://updated.com",
            location_range="South",
            price_range={"min": 20, "max": 200}
        )
        request = self.simulate_request()
        updated = self.controller.update_specialist(request, payload)
        assert updated.description == "Updated Desc"
        assert updated.portfolio_link == "http://updated.com"

    def test_delete_specialist(self):
        Specialist.objects.create(
            user=self.user,
            description="To delete",
            location_range="DeleteZone",
            price_range={"min": 5, "max": 55}
        )
        request = self.simulate_request()
        response = self.controller.delete_specialist(request)
        assert response["msg"] == "Specialist profile deleted successfully!"
        assert not Specialist.objects.filter(user=self.user).exists()

    def test_get_specialist_by_user_id(self):
        Specialist.objects.create(
            user=self.user,
            description="Query test",
            location_range="TestCity",
            price_range={"min": 0, "max": 50}
        )
        result = self.controller.get_specialist_by_user_id(self.user.id)
        assert result.description == "Query test"

    def test_get_all_specialists(self):
        Specialist.objects.create(user=self.user, description="Bulk", location_range="X", price_range={"min": 1, "max": 2})
        another = CustomUser.objects.create_user(username="b", email="b@b.com", password="x")
        Specialist.objects.create(user=another, description="B2", location_range="Y", price_range={"min": 3, "max": 5})
        request = self.simulate_request()
        specialists = self.controller.get_all_specialists(request)
        assert len(specialists) == 2

    def test_get_specialist_by_tag(self):
        specialist = Specialist.objects.create(
            user=self.user,
            description="Tagged",
            location_range="TLV",
            price_range={"min": 0, "max": 100}
        )
        specialist.service_tags.add(self.tag1)
        results = self.controller.get_specialist_by_tag("Plumber")
        assert len(results) == 1
        assert results[0].description == "Tagged"

    def test_get_specialist_by_location_range(self):
        Specialist.objects.create(user=self.user, description="LRange", location_range="Jerusalem", price_range={"min": 5, "max": 15})
        results = self.controller.get_specialist_by_location_range("Jerusalem")
        assert len(results) == 1

    def test_get_specialist_by_price_range(self):
        Specialist.objects.create(user=self.user, description="PriceMatch", location_range="City", price_range={"min": 50, "max": 150})
        results = self.controller.get_specialist_by_price_range(100)
        assert len(results) == 1
        assert results[0].description == "PriceMatch"
