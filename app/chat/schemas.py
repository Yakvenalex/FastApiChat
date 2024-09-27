from pydantic import BaseModel


class MessageRead(BaseModel):
    id: int
    sender_id: int
    recipient_id: int
    content: str


class MessageCreate(BaseModel):
    recipient_id: int
    content: str
