from ninja import Schema
from typing import Optional
from datetime import datetime

class NotificationSchema(Schema):
    id: int
    title: str
    body: str
    data: Optional[dict]
    created_at: datetime
    read: bool

