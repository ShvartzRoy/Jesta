import pytest
from django.test import TestCase
from django.utils import timezone
from users.models import CustomUser
from services.models import Service
from reviews.models import Review
from datetime import timedelta

class ReviewModelTest(TestCase):

    def setUp(self):
        self.reviewer = CustomUser.objects.create_user(
            username="reviewer", email="reviewer@example.com", password="test123"
        )
        self.reviewed = CustomUser.objects.create_user(
            username="reviewed", email="reviewed@example.com", password="test123"
        )
        self.service = Service.objects.create(
            user=self.reviewed,
            title="Test Service",
            description="Service description",
            location="Test Location",
            date_time_range=["2025-01-01T10:00:00", "2025-01-01T12:00:00"],
            estimated_duration=timedelta(hours=2),
        )

    def test_create_review(self):
        review = Review.objects.create(
            reviewer=self.reviewer,
            reviewed_user=self.reviewed,
            service=self.service,
            ranking=4,
            info="Well done"
        )
        self.assertEqual(str(review), f"Review by {self.reviewer} for {self.reviewed} - {review.ranking}")
        self.assertEqual(review.ranking, 4)
        self.assertEqual(review.info, "Well done")
        self.assertEqual(review.service, self.service)
        self.assertTrue(review.created_at <= timezone.now())

    def test_unique_constraint(self):
        Review.objects.create(
            reviewer=self.reviewer,
            reviewed_user=self.reviewed,
            service=self.service,
            ranking=5,
            info="Great"
        )
        with self.assertRaises(Exception):
            # This should raise due to the unique_together constraint
            Review.objects.create(
                reviewer=self.reviewer,
                reviewed_user=self.reviewed,
                service=self.service,
                ranking=3,
                info="Duplicate"
            )
