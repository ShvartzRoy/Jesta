import json
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
from .models import Conversation, Message

class OneToOneChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Expect a conversation_id in the URL
        self.conversation_id = self.scope["url_route"]["kwargs"]["conversation_id"]
        self.room_group_name = f"conversation_{self.conversation_id}"
        
        # (Optional) Here, you can add authentication checks to ensure the user is a participant.
        
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        message_content = data.get("message", "")

        # Save the message in the database
        await self.save_message(self.conversation_id, self.scope["user"], message_content)

        # Broadcast the message to all members in the room group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                "type": "chat_message",
                "message": message_content,
                "sender": self.scope["user"].username,
            }
        )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            "message": event["message"],
            "sender": event["sender"],
        }))

    @sync_to_async
    def save_message(self, conversation_id, user, message_content):
        conversation = Conversation.objects.get(id=conversation_id)
        Message.objects.create(conversation=conversation, sender=user, content=message_content)
