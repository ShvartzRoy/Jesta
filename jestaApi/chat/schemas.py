from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class MessageSchema(BaseModel):
    id: int
    chat_id: int
    sender_id: int
    content: str
    timestamp: datetime
    is_read: bool

    class Config:
        orm_mode = True
        from_attributes = True

class ChatSchema(BaseModel):
    id: int
    user1_id: int
    user2_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
        from_attributes = True

class ChatInitiateSchema(BaseModel):
    other_user_id: int

class ChatSendMessageSchema(BaseModel):
    chat_id: int
    content: str

class ChatGetNewMessagesSchema(BaseModel):
    chat_id: int
    last_message_id: Optional[int] = None

class ReadMessagesSchema(BaseModel):
    chat_id: int

class ChatResponseSchema(BaseModel):
    message: str
    chat_id: Optional[int] = None

class MessageResponseSchema(BaseModel):
    message: str
    message_id: Optional[int] = None

class ChatListSchema(BaseModel):
    chats: List[ChatSchema]
