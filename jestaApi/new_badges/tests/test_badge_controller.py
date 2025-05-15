import pytest
from django.test import TestCase
from new_badges.models import Badge
from new_badges.badgeController import BadgeController
from users.models import CustomUser, Profile

class TestBadgeController(TestCase):
    def setUp(self):
        Badge.objects.all().delete()  
        self.controller = BadgeController()
        self.badge_data = {
            "name": "Excellent",
            "description": "Awarded for great performance",
            "image": "http://example.com/image.png"
        }
        self.user = CustomUser.objects.create_user(
            username="testuser",
            email="testuser@mail.tau.ac.il",
            password="pass1234"
        )
        self.profile = Profile.objects.create(user=self.user)

    def test_add_badge_success(self):
        result = self.controller.add_badge(**self.badge_data)
        assert result["name"] == "Excellent"
        assert result["description"] == "Awarded for great performance"

    def test_add_badge_duplicate(self):
        self.controller.add_badge(**self.badge_data)
        with pytest.raises(Exception):
            self.controller.add_badge(**self.badge_data)

    def test_edit_badge(self):
        badge = Badge.objects.create(name="OldName", description="Old", image="old.png")
        result = self.controller.edit_badge(
            badge.id, name="NewName", description="Updated desc", image="http://image.com"
        )
        assert result["name"] == "NewName"
        assert result["description"] == "Updated desc"

    def test_remove_badge(self):
        badge = Badge.objects.create(name="ToDelete")
        response = self.controller.remove_badge(badge.id)
        assert "deleted successfully" in response["message"]
        assert not Badge.objects.filter(id=badge.id).exists()

    def test_get_all_badges(self):
        Badge.objects.create(name="Badge1")
        Badge.objects.create(name="Badge2")
        result = self.controller.get_all_badges()
        assert len(result) == 2

    def test_get_badge(self):
        badge = Badge.objects.create(name="FindMe")
        result = self.controller.get_badge(badge.id)
        assert result["name"] == "FindMe"

    def test_get_badge_by_name(self):
        Badge.objects.create(name="NamedBadge")
        result = self.controller.get_badge_by_name("NamedBadge")
        assert result["name"] == "NamedBadge"

    def test_assign_badge_if_missing_assigns(self):
        badge = Badge.objects.create(name="Student")
        self.controller.assign_badge_if_missing(self.user, "Student")
        self.assertTrue(self.profile.badges.filter(name="Student").exists())

    def test_assign_badge_if_missing_already_has(self):
        badge = Badge.objects.create(name="Student")
        self.profile.badges.add(badge)
        self.controller.assign_badge_if_missing(self.user, "Student")
        self.assertEqual(self.profile.badges.filter(name="Student").count(), 1)

    def test_check_and_assign_all_badges(self):
        Badge.objects.create(name="Experienced")
        Badge.objects.create(name="Excellent")
        Badge.objects.create(name="Community Contributor")
        Badge.objects.create(name="Student")

        self.controller.check_and_assign_all_badges(self.user)
