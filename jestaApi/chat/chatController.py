from typing import List, Optional
from django.shortcuts import get_object_or_404
from django.core.exceptions import ValidationError
from django.utils import timezone
from ninja.errors import HttpError
from .models import Chat, Message
from users.models import CustomUser
from .schemas import *

class ChatController:
    
    def initiate_chat(self, request, other_user_id: int) -> ChatResponseSchema:
        """
        Initiates a one-on-one chat between the request user and another user.
        Returns a ChatResponseSchema with a message and the chat ID.
        """
        if request.user.id == other_user_id:
            raise HttpError(400, "Cannot initiate chat with yourself.")
        
        other_user = get_object_or_404(CustomUser, id=other_user_id)
        # Enforce consistent ordering so that (A, B) is always stored as (A, B) if A.id < B.id
        user1, user2 = (request.user, other_user) if request.user.id < other_user.id else (other_user, request.user)
        
        chat = Chat.objects.filter(user1=user1, user2=user2).first()
        if chat:
            return ChatResponseSchema(message="Chat already exists.", chat_id=chat.id)
        
        chat = Chat.objects.create(user1=user1, user2=user2)
        return ChatResponseSchema(message="Chat initiated successfully.", chat_id=chat.id)
    
    def delete_chat(self, request, chat_id: int) -> ChatResponseSchema:
        """
        Deletes a chat if the request user is a participant.
        """
        chat = get_object_or_404(Chat, id=chat_id)
        if request.user not in [chat.user1, chat.user2]:
            raise HttpError(403, "You do not have permission to delete this chat.")
        
        chat.delete()
        return ChatResponseSchema(message="Chat deleted successfully.")
    
    def send_message(self, request, chat_id: int, content: str) -> MessageResponseSchema:
        """
        Sends a message in the specified chat.
        Returns a MessageResponseSchema with a confirmation message and the new message ID.
        """
        chat = get_object_or_404(Chat, id=chat_id)
        if request.user not in [chat.user1, chat.user2]:
            raise HttpError(403, "You are not a participant of this chat.")
        
        message = Message.objects.create(
            chat=chat,
            sender=request.user,
            content=content
        )
        # Optionally update the chat's updated_at timestamp by saving it.
        chat.save()
        return MessageResponseSchema(message="Message sent successfully.", message_id=message.id)
    
    def get_new_messages(self, request, chat_id: int, last_message_id: Optional[int] = None) -> List[MessageSchema]:
        """
        Returns messages in a chat with an ID greater than `last_message_id`.
        If not provided, returns the full chat history.
        """
        chat = get_object_or_404(Chat, id=chat_id)
        if request.user not in [chat.user1, chat.user2]:
            raise HttpError(403, "You are not a participant of this chat.")
        
        if last_message_id:
            messages = chat.messages.filter(id__gt=last_message_id).order_by("timestamp")
        else:
            messages = chat.messages.all().order_by("timestamp")
        return [MessageSchema.from_orm(msg) for msg in messages]
    
    def read_messages(self, request, chat_id: int) -> ChatResponseSchema:
        """
        Marks unread messages (sent by the other participant) in the chat as read.
        """
        chat = get_object_or_404(Chat, id=chat_id)
        if request.user not in [chat.user1, chat.user2]:
            raise HttpError(403, "You are not a participant of this chat.")
        print(f"User: {request.user}, Chat ID: {chat_id} reading messages")
        unread_messages = chat.messages.filter(is_read=False).exclude(sender=request.user)
        count = unread_messages.update(is_read=True)
        return ChatResponseSchema(message=f"Marked {count} messages as read.")
    
    def get_chat_history(self, request, chat_id: int) -> List[MessageSchema]:
        """
        Returns the full history of messages in a chat.
        """
        chat = get_object_or_404(Chat, id=chat_id)
        if request.user not in [chat.user1, chat.user2]:
            raise HttpError(403, "You are not a participant of this chat.")
        
        messages = chat.messages.all().order_by("timestamp")
        return [MessageSchema.from_orm(msg) for msg in messages]
    
    def get_all_chats(self, request) -> ChatListSchema:
        """
        Returns all chats that the request user participates in.
        """
        chats_as_user1 = Chat.objects.filter(user1=request.user)
        chats_as_user2 = Chat.objects.filter(user2=request.user)
        all_chats = (chats_as_user1 | chats_as_user2).order_by("-updated_at")
        chat_schemas = [ChatSchema.from_orm(chat) for chat in all_chats]
        return ChatListSchema(chats=chat_schemas)
