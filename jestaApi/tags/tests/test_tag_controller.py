import pytest
from django.test import TestCase
from django.shortcuts import get_object_or_404
from ninja.errors import HttpError
from tags.models import Tag, SpecialistTag, Category
from tags.tagController import TagController

class TagControllerTest(TestCase):
    def setUp(self):
        self.controller = TagController()

        self.category = Category.objects.create(name="Category1")
        self.tag = Tag.objects.create(name="Tag1")
        self.category.tags.add(self.tag)

        self.specialist_tag = SpecialistTag.objects.create(name="SpecTag1")
        self.category.specialist_tags.add(self.specialist_tag)

    def test_add_tag_success(self):
        response = self.controller.add_tag("NewTag", self.category.id)
        self.assertEqual(response["name"], "NewTag")
        self.assertIn("successfully", response["message"])
        tag_obj = Tag.objects.get(name="NewTag")
        self.assertIn(self.category, tag_obj.categories.all())

    def test_add_tag_duplicate(self):
        with self.assertRaises(HttpError):
            self.controller.add_tag(self.tag.name, self.category.id)

    def test_remove_tag(self):
        tag_to_remove = Tag.objects.create(name="TagToRemove")
        self.category.tags.add(tag_to_remove)
        resp = self.controller.remove_tag(tag_to_remove.id)
        self.assertIn("deleted successfully", resp["message"])
        with self.assertRaises(Tag.DoesNotExist):
            Tag.objects.get(id=tag_to_remove.id)
        self.assertNotIn(tag_to_remove, self.category.tags.all())

    def test_edit_tag(self):
        resp = self.controller.edit_tag(self.tag.id, "UpdatedTagName")
        self.assertEqual(resp["name"], "UpdatedTagName")
        tag = Tag.objects.get(id=self.tag.id)
        self.assertEqual(tag.name, "UpdatedTagName")

    def test_get_all_tags(self):
        tags = self.controller.get_all_tags()
        self.assertIsInstance(tags, list)
        self.assertTrue(any(t["name"] == self.tag.name for t in tags))

    def test_get_tag(self):
        tag = self.controller.get_tag(self.tag.id)
        self.assertEqual(tag["name"], self.tag.name)

    def test_get_tag_by_name(self):
        tag = self.controller.get_tag_by_name(self.tag.name)
        self.assertEqual(tag["id"], self.tag.id)

    def test_add_specialist_tag_success(self):
        resp = self.controller.add_specialist_tag("NewSpecTag", self.category.id)
        self.assertEqual(resp["name"], "NewSpecTag")
        spec_tag_obj = SpecialistTag.objects.get(name="NewSpecTag")
        self.assertIn(self.category, spec_tag_obj.categories.all())

    def test_add_specialist_tag_duplicate(self):
        with self.assertRaises(HttpError):
            self.controller.add_specialist_tag(self.specialist_tag.name, self.category.id)

    def test_remove_specialist_tag(self):
        spec_tag_to_remove = SpecialistTag.objects.create(name="SpecTagToRemove")
        self.category.specialist_tags.add(spec_tag_to_remove)
        resp = self.controller.remove_specialist_tag(spec_tag_to_remove.id)
        self.assertIn("deleted successfully", resp["message"])
        with self.assertRaises(SpecialistTag.DoesNotExist):
            SpecialistTag.objects.get(id=spec_tag_to_remove.id)
        self.assertNotIn(spec_tag_to_remove, self.category.specialist_tags.all())

    def test_add_category_success(self):
        resp = self.controller.add_category("NewCategory")
        self.assertEqual(resp["name"], "NewCategory")
        cat = Category.objects.get(name="NewCategory")
        self.assertEqual(resp["tags"], [])
        self.assertEqual(resp["specialist_tags"], [])

    def test_add_category_duplicate(self):
        with self.assertRaises(HttpError):
            self.controller.add_category(self.category.name)

    def test_add_tag_to_category(self):
        new_tag = Tag.objects.create(name="AnotherTag")
        resp = self.controller.add_tag_to_category(self.category.id, new_tag.id)
        self.assertIn("added to category", resp["message"])
        self.assertIn(new_tag, self.category.tags.all())

    def test_remove_tag_from_category(self):
        resp = self.controller.remove_tag_from_category(self.category.id, self.tag.id)
        self.assertIn("removed from category", resp["message"])
        self.assertNotIn(self.tag, self.category.tags.all())

    def test_add_specialist_tag_to_category(self):
        new_spec_tag = SpecialistTag.objects.create(name="AnotherSpecTag")
        resp = self.controller.add_specialist_tag_to_category(self.category.id, new_spec_tag.id)
        self.assertIn("added to category", resp["message"])
        self.assertIn(new_spec_tag, self.category.specialist_tags.all())

    def test_remove_specialist_tag_from_category(self):
        resp = self.controller.remove_specialist_tag_from_category(self.category.id, self.specialist_tag.id)
        self.assertIn("removed from category", resp["message"])
        self.assertNotIn(self.specialist_tag, self.category.specialist_tags.all())

    def test_get_categories(self):
        categories = self.controller.get_categories()
        self.assertIsInstance(categories, list)
        self.assertTrue(any(c["id"] == self.category.id for c in categories))
        for c in categories:
            self.assertIn("tags", c)
            self.assertIn("specialist_tags", c)

    def test_get_category_by_tag_id(self):
        categories = self.controller.get_category_by_tag_id(self.tag.id)
        self.assertTrue(any(c["id"] == self.category.id for c in categories))

    def test_get_category_by_specialist_tag_id(self):
        categories = self.controller.get_category_by_specialist_tag_id(self.specialist_tag.id)
        self.assertTrue(any(c["id"] == self.category.id for c in categories))
