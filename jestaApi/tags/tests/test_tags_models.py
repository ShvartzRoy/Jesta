from django.test import TestCase
from tags.models import Tag, SpecialistTag, Category

class TagModelTest(TestCase):
    def test_create_tag(self):
        tag = Tag.objects.create(name="TestTag")
        self.assertEqual(str(tag), "TestTag")
        self.assertEqual(tag.name, "TestTag")

class SpecialistTagModelTest(TestCase):
    def test_create_specialist_tag(self):
        spec_tag = SpecialistTag.objects.create(name="SpecTag")
        self.assertEqual(str(spec_tag), "SpecTag")
        self.assertEqual(spec_tag.name, "SpecTag")

class CategoryModelTest(TestCase):
    def setUp(self):
        self.tag1 = Tag.objects.create(name="Tag1")
        self.spec_tag1 = SpecialistTag.objects.create(name="SpecTag1")

    def test_create_category(self):
        category = Category.objects.create(name="Category1")
        category.tags.add(self.tag1)
        category.specialist_tags.add(self.spec_tag1)

        self.assertEqual(str(category), "Category1")
        self.assertIn(self.tag1, category.tags.all())
        self.assertIn(self.spec_tag1, category.specialist_tags.all())
