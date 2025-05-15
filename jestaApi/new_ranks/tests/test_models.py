from django.test import TestCase
from django.contrib.auth import get_user_model
from new_ranks.models import Rank
from new_badges.models import Badge

class RankModelTest(TestCase):
    def setUp(self):
        Rank.objects.all().delete()
        Badge.objects.all().delete()
        self.User = get_user_model()
        self.user = self.User.objects.create_user(username="rankuser", email="rank@example.com", password="pass123")

    def test_create_rank(self):
        rank = Rank.objects.create(user=self.user, xp=1000, level=3)
        self.assertEqual(rank.user, self.user)
        self.assertEqual(rank.xp, 1000)
        self.assertEqual(rank.level, 3)
        self.assertEqual(str(rank), f"Rank of {self.user} - Level 3 - XP 1000")

    def test_badge_assignment(self):
        rank = Rank.objects.create(user=self.user)
        badge = Badge.objects.create(name="Experienced")
        rank.badges.add(badge)
        self.assertIn(badge, rank.badges.all())
