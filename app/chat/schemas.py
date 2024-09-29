from pydantic import BaseModel, Field


class MessageRead(BaseModel):
    id: int = Field(..., description="Уникальный идентификатор сообщения")
    sender_id: int = Field(..., description="ID отправителя сообщения")
    recipient_id: int = Field(..., description="ID получателя сообщения")
    content: str = Field(..., description="Содержимое сообщения")


class MessageCreate(BaseModel):
    recipient_id: int = Field(..., description="ID получателя сообщения")
    content: str = Field(..., description="Содержимое сообщения")