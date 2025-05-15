import pytest
from django.test import TestCase
from django.contrib.auth import get_user_model
from specialists.models import Specialist
from tags.models import SpecialistTag

User = get_user_model()

class TestSpecialistModel(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="specialist_user",
            email="specialist@example.com",
            password="secure123"
        )
        self.tag1 = SpecialistTag.objects.create(name="Gardener")
        self.tag2 = SpecialistTag.objects.create(name="Electrician")

    def test_create_specialist(self):
        specialist = Specialist.objects.create(
            user=self.user,
            description="Professional gardener",
            portfolio_link="http://myportfolio.com",
            location_range="Haifa",
            price_range={"min": 100, "max": 200},
        )
        specialist.service_tags.add(self.tag1, self.tag2)

        self.assertEqual(specialist.user, self.user)
        self.assertEqual(specialist.description, "Professional gardener")
        self.assertEqual(specialist.portfolio_link, "http://myportfolio.com")
        self.assertEqual(specialist.location_range, "Haifa")
        self.assertEqual(specialist.price_range["min"], 100)
        self.assertEqual(specialist.price_range["max"], 200)
        self.assertEqual(specialist.service_tags.count(), 2)
        self.assertIn(self.tag1, specialist.service_tags.all())
        self.assertIn(self.tag2, specialist.service_tags.all())

    def test_str_representation(self):
        specialist = Specialist.objects.create(
            user=self.user,
            description="Electrician",
            price_range={"min": 80, "max": 150}
        )
        specialist.service_tags.add(self.tag1, self.tag2)
        expected = f"{self.user.email} - Gardener, Electrician"
        self.assertEqual(str(specialist), expected)
