from django.test import TestCase
from .models import Badge
from .badgeController import BadgeController

class BadgeTests(TestCase):
    def setUp(self):
        self.badge_controller = BadgeController()

    def test_add_badge(self):
        badge = self.badge_controller.add_badge("Example")
        self.assertEqual(badge.name, "Example")

    def test_remove_badge(self):
        badge = self.badge_controller.add_badge("Removable")
        response = self.badge_controller.remove_badge(badge.id)
        self.assertEqual(response["message"], f"Badge '{badge.name}' deleted successfully!!")

    def test_get_all_badges(self):
        self.badge_controller.add_badge("Badge1")
        self.badge_controller.add_badge("Badge2")
        badges = self.badge_controller.get_all_badges()
        self.assertEqual(len(badges), 2)

    def test_get_badge(self):
        badge = self.badge_controller.add_badge("SingleBadge")
        fetched_badge = self.badge_controller.get_badge(badge.id)
        self.assertEqual(fetched_badge.name, "SingleBadge")