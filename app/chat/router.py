from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Request, Depends
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from typing import List
from app.chat.dao import MessagesDAO
from app.chat.schemas import MessageRead, MessageCreate
from app.users.dao import UsersDAO
from app.users.dependencies import get_current_user
from app.users.models import User

router = APIRouter(prefix='/chat', tags=['Chat'])
templates = Jinja2Templates(directory='app/templates')

active_connections: List[dict] = []


@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int):
    await websocket.accept()
    active_connections.append({"websocket": websocket, "user_id": user_id})
    try:
        while True:
            data = await websocket.receive_text()
            # Assuming data contains the message details, you can broadcast it
            for connection in active_connections:
                if connection["user_id"] != user_id:  # Don't send to sender
                    await connection["websocket"].send_text(data)
    except WebSocketDisconnect:
        active_connections.remove({"websocket": websocket, "user_id": user_id})


@router.get("/", response_class=HTMLResponse, summary="Страница чата")
async def get_chat_page(request: Request, user_data: User = Depends(get_current_user)):
    users_all = await UsersDAO.find_all()
    return templates.TemplateResponse("chat.html", {"request": request, "user": user_data, 'users_all': users_all})


@router.get("/messages/{user_id}", response_model=List[MessageRead])
async def get_messages(user_id: int, current_user: User = Depends(get_current_user)):
    return await MessagesDAO.get_messages_between_users(user_id_1=user_id, user_id_2=current_user.id) or []


@router.post("/messages", response_model=MessageCreate)
async def send_message(message: MessageCreate, current_user: User = Depends(get_current_user)):
    await MessagesDAO.add(
        sender_id=current_user.id,
        content=message.content,
        recipient_id=message.recipient_id
    )
    # Notify the recipient via WebSocket
    for connection in active_connections:
        if connection["user_id"] == message.recipient_id:
            await connection["websocket"].send_text(f"New message from {current_user.id}: {message.content}")
    return {'recipient_id': message.recipient_id, 'content': message.content, 'status': 'ok', 'msg': 'message save!'}
