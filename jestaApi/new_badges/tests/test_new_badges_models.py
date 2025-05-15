from django.test import TestCase
from new_badges.models import Badge

class BadgeModelTest(TestCase):

    def setUp(self):
        Badge.objects.all().delete()  

    def test_create_badge(self):
        badge = Badge.objects.create(
            name="Excellent",
            description="Awarded for top performance",
            image="http://example.com/badge.png"
        )
        self.assertEqual(badge.name, "Excellent")
        self.assertEqual(str(badge), "Excellent")
        self.assertEqual(badge.description, "Awarded for top performance")
        self.assertEqual(badge.image, "http://example.com/badge.png")

    def test_unique_name_constraint(self):
        Badge.objects.create(name="UniqueBadge")
        with self.assertRaises(Exception):
            Badge.objects.create(name="UniqueBadge")
