import pytest
from django.test import TestCase, RequestFactory
from users.models import CustomUser
from chat.models import Chat, Message
from chat.chatController import ChatController

class TestChatController(TestCase):
    def setUp(self):
        self.factory = RequestFactory()
        self.controller = ChatController()
        self.user1 = CustomUser.objects.create_user(username="user1", email="user1@test.com", password="pass")
        self.user2 = CustomUser.objects.create_user(username="user2", email="user2@test.com", password="pass")
        self.chat = Chat.objects.create(user1=self.user1, user2=self.user2)

    def simulate_request(self, user):
        request = self.factory.post("/")
        request.user = user
        return request

    def test_initiate_chat_success(self):
        request = self.simulate_request(self.user1)
        response = self.controller.initiate_chat(request, self.user2.id)
        assert response.message in ["Chat initiated successfully.", "Chat already exists."]

    def test_initiate_chat_with_self(self):
        request = self.simulate_request(self.user1)
        with pytest.raises(Exception):
            self.controller.initiate_chat(request, self.user1.id)

    def test_delete_chat(self):
        request = self.simulate_request(self.user1)
        response = self.controller.delete_chat(request, self.chat.id)
        assert response.message == "Chat deleted successfully."
        assert not Chat.objects.filter(id=self.chat.id).exists()

    def test_send_message_success(self):
        request = self.simulate_request(self.user1)
        result = self.controller.send_message(request, self.chat.id, "Hello!")
        assert result.message == "Message sent successfully."

    def test_send_message_unauthorized(self):
        other = CustomUser.objects.create_user(username="other", email="other@test.com", password="pass")
        request = self.simulate_request(other)
        with pytest.raises(Exception):
            self.controller.send_message(request, self.chat.id, "Not allowed")

    def test_get_new_messages(self):
        Message.objects.create(chat=self.chat, sender=self.user1, content="Msg1")
        request = self.simulate_request(self.user2)
        messages = self.controller.get_new_messages(request, self.chat.id)
        assert len(messages) == 1

    def test_read_messages(self):
        Message.objects.create(chat=self.chat, sender=self.user1, content="Unread", is_read=False)
        request = self.simulate_request(self.user2)
        response = self.controller.read_messages(request, self.chat.id)
        assert "Marked" in response.message

    def test_get_chat_history(self):
        Message.objects.create(chat=self.chat, sender=self.user1, content="History test")
        request = self.simulate_request(self.user2)
        history = self.controller.get_chat_history(request, self.chat.id)
        assert len(history) == 1

    def test_get_all_chats(self):
        request = self.simulate_request(self.user1)
        response = self.controller.get_all_chats(request)
        assert len(response.chats) == 1
