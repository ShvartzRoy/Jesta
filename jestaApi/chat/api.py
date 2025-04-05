from ninja import Router
from typing import List, Optional
from .chatController import ChatController
from .schemas import *

router = Router(tags=["Chats"])
cc = ChatController()

@router.post("/initiate_chat", response=ChatResponseSchema)
def initiate_chat(request, payload: ChatInitiateSchema):
    """
    Initiates a one-on-one chat between the request user and the specified other user.
    """
    return cc.initiate_chat(request, payload.other_user_id)

@router.delete("/delete_chat/{chat_id}", response=ChatResponseSchema)
def delete_chat(request, chat_id: int):
    """
    Deletes a chat if the request user is a participant.
    """
    return cc.delete_chat(request, chat_id)

@router.post("/send_message", response=MessageResponseSchema)
def send_message(request, payload: ChatSendMessageSchema):
    """
    Sends a message to the specified chat.
    """
    return cc.send_message(request, payload.chat_id, payload.content)

@router.get("/get_new_messages", response=List[MessageSchema])
def get_new_messages(request, chat_id: int, last_message_id: Optional[int] = None):
    """
    Retrieves new messages from a chat.
    If last_message_id is provided, only messages with a higher ID are returned.
    """
    return cc.get_new_messages(request, chat_id, last_message_id)

@router.post("/read_messages", response=ChatResponseSchema)
def read_messages(request, payload: ReadMessagesSchema):
    """
    Marks unread messages (sent by the other user) as read.
    """
    return cc.read_messages(request, payload.chat_id)

@router.get("/chat_history/{chat_id}", response=List[MessageSchema])
def chat_history(request, chat_id: int):
    """
    Returns the complete chat history for the specified chat.
    """
    return cc.get_chat_history(request, chat_id)

@router.get("/complete_chat/{chat_id}", response=List[MessageSchema])
def chat_history(request, chat_id: int):
    """
    Returns the complete chat including metadata and full message history.
    """
    return cc.get_chat_history(request, chat_id)

@router.get("/all_chats", response=ChatListSchema)
def all_chats(request):
    """
    Retrieves a list of all chats the request user participates in, along with summary data.
    """
    return cc.get_all_chats(request)
