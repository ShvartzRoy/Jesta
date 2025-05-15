from django.test import TestCase
from django.core.exceptions import ValidationError
from users.models import CustomUser
from chat.models import Chat, Message


class ChatModelTests(TestCase):
    def setUp(self):
        self.user1 = CustomUser.objects.create_user(
            username="alice", email="alice@example.com", password="pass"
        )
        self.user2 = CustomUser.objects.create_user(
            username="bob", email="bob@example.com", password="pass"
        )

    def test_create_chat_success(self):
        chat = Chat.objects.create(user1=self.user1, user2=self.user2)
        self.assertEqual(chat.user1, self.user1)
        self.assertEqual(chat.user2, self.user2)
        self.assertIn("alice", str(chat))
        self.assertIn("bob", str(chat))

    def test_create_chat_same_user_validation(self):
        with self.assertRaises(ValidationError):
            chat = Chat(user1=self.user1, user2=self.user1)
            chat.full_clean()

    def test_chat_user_ordering(self):
        chat = Chat.objects.create(user1=self.user2, user2=self.user1)  # out of order
        self.assertLessEqual(chat.user1.id, chat.user2.id)

    def test_chat_uniqueness(self):
        Chat.objects.create(user1=self.user1, user2=self.user2)
        with self.assertRaises(Exception):
            Chat.objects.create(user1=self.user2, user2=self.user1)  # same pair, reversed


class MessageModelTests(TestCase):
    def setUp(self):
        self.sender = CustomUser.objects.create_user(
            username="charlie", email="charlie@example.com", password="pass"
        )
        self.receiver = CustomUser.objects.create_user(
            username="dave", email="dave@example.com", password="pass"
        )
        self.chat = Chat.objects.create(user1=self.sender, user2=self.receiver)

    def test_create_message_success(self):
        msg = Message.objects.create(chat=self.chat, sender=self.sender, content="Hello world")
        self.assertEqual(msg.chat, self.chat)
        self.assertEqual(msg.sender, self.sender)
        self.assertEqual(msg.content, "Hello world")
        self.assertFalse(msg.is_read)
        self.assertIn("charlie", str(msg))
        self.assertIn("Hello", str(msg))
