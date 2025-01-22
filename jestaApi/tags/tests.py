from django.test import TestCase
from .models import Tag
from .tagController import TagController

class TagTests(TestCase):
    def setUp(self):
        self.tag_controller = TagController()

    def test_add_tag(self):
        tag = self.tag_controller.add_tag("Example")
        self.assertEqual(tag.name, "Example")

    def test_remove_tag(self):
        tag = self.tag_controller.add_tag("Removable")
        response = self.tag_controller.remove_tag(tag.id)
        self.assertEqual(response["message"], f"Tag '{tag.name}' deleted successfully!!")

    def test_get_all_tags(self):
        self.tag_controller.add_tag("Tag1")
        self.tag_controller.add_tag("Tag2")
        tags = self.tag_controller.get_all_tags()
        self.assertEqual(len(tags), 2)

    def test_get_tag(self):
        tag = self.tag_controller.add_tag("SingleTag")
        fetched_tag = self.tag_controller.get_tag(tag.id)
        self.assertEqual(fetched_tag.name, "SingleTag")
