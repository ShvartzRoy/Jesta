import pytest
from django.test import TestCase, RequestFactory
from django.contrib.auth import get_user_model
from new_ranks.models import Rank
from new_badges.models import Badge
from new_ranks.rankController import RankController
from new_ranks.schemas import RankCreateSchema


class TestRankController(TestCase):
    def setUp(self):
        Rank.objects.all().delete()
        Badge.objects.all().delete()
        self.User = get_user_model()
        self.user = self.User.objects.create_user(username="rankuser", email="rank@example.com", password="pass123")
        self.factory = RequestFactory()
        self.request = self.factory.post("/")
        self.request.user = self.user
        self.controller = RankController()

    def test_create_rank(self):
        payload = RankCreateSchema(user_id=self.user.id, xp=300, level=2, badges=[])
        result = self.controller.create_rank(self.request, payload)
        assert result.xp == 300
        assert result.level == 2

    def test_create_rank_invalid_user(self):
        other = self.User.objects.create_user(username="other", email="other@example.com", password="pass123")
        payload = RankCreateSchema(user_id=other.id, xp=100, level=1, badges=[])
        with pytest.raises(Exception):
            self.controller.create_rank(self.request, payload)

    def test_add_xp_and_update_level(self):
        Rank.objects.create(user=self.user, xp=400, level=1)
        self.controller.add_xp(self.user.id, 200)
        rank = Rank.objects.get(user=self.user)
        assert rank.xp == 600
        assert rank.level == 2  # 600 // 500 + 1

    def test_get_rank(self):
        rank = Rank.objects.create(user=self.user, xp=150, level=1)
        result = self.controller.get_rank(self.request, self.user.id)
        assert result == rank

    def test_add_badges_based_on_criteria(self):
        Rank.objects.create(user=self.user, xp=2600, level=6)  # level ≥ 5 triggers badge
        Badge.objects.create(name="Experienced")
        self.controller.update_badges(self.user.id)
        rank = Rank.objects.get(user=self.user)
        assert "Experienced" in [b.name for b in rank.badges.all()]

    def test_get_badges(self):
        badge = Badge.objects.create(name="TestBadge")
        rank = Rank.objects.create(user=self.user)
        rank.badges.add(badge)
        result = self.controller.get_badges(self.user.id)
        assert len(result) == 1
        assert result[0].name == "TestBadge"

    def test_get_xp_and_level(self):
        Rank.objects.create(user=self.user, xp=750, level=2)
        assert self.controller.get_xp(self.user.id) == 750
        assert self.controller.get_level(self.user.id) == 2

    def test_add_xp_for_completed_service(self):
        Rank.objects.create(user=self.user)
        self.controller.add_xp_for_completed_service(self.user.id, is_volunteer=True)
        rank = Rank.objects.get(user=self.user)
        assert rank.xp == 150

    def test_add_xp_for_referral(self):
        Rank.objects.create(user=self.user)
        self.controller.add_xp_for_referral(self.user.id)
        rank = Rank.objects.get(user=self.user)
        assert rank.xp == 200

    def test_add_xp_for_positive_review(self):
        Rank.objects.create(user=self.user)
        self.controller.add_xp_for_positive_review(self.user.id, 4)
        rank = Rank.objects.get(user=self.user)
        assert rank.xp == 50
