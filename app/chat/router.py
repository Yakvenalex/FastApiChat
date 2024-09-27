from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Request, Depends
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from typing import List, Dict
from app.chat.dao import MessagesDAO
from app.chat.schemas import MessageRead, MessageCreate
from app.users.dao import UsersDAO
from app.users.dependencies import get_current_user
from app.users.models import User
import asyncio
import logging

router = APIRouter(prefix='/chat', tags=['Chat'])
templates = Jinja2Templates(directory='app/templates')

# Словарь активных WebSocket соединений: {user_id: websocket}
active_connections: Dict[int, WebSocket] = {}

# Логирование
logger = logging.getLogger(__name__)


async def notify_user(user_id: int, message: str):
    """Отправка сообщения пользователю, если он подключен."""
    if user_id in active_connections:
        websocket = active_connections[user_id]
        await websocket.send_text(message)


async def broadcast_message(sender_id: int, message: str):
    """Рассылка сообщения всем пользователям, кроме отправителя."""
    tasks = [
        connection.send_text(message)
        for user_id, connection in active_connections.items()
        if user_id != sender_id
    ]
    if tasks:
        await asyncio.gather(*tasks)


# Обработчик WebSocket соединений для чата
@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int):
    await websocket.accept()  # Принятие WebSocket соединения
    active_connections[user_id] = websocket  # Добавление подключения в словарь
    try:
        while True:
            data = await websocket.receive_text()  # Получение сообщения от пользователя
            await broadcast_message(user_id, data)  # Рассылка сообщения всем пользователям
    except WebSocketDisconnect:
        # Удаление подключения при разрыве соединения
        if user_id in active_connections:
            del active_connections[user_id]
        logger.info(f"User {user_id} disconnected from WebSocket.")


# Страница чата
@router.get("/", response_class=HTMLResponse, summary="Страница чата")
async def get_chat_page(request: Request, user_data: User = Depends(get_current_user)):
    # Кэширование пользователей для повышения производительности
    if not hasattr(get_chat_page, 'users_cache'):
        get_chat_page.users_cache = await UsersDAO.find_all()  # Кэшируем список пользователей
    return templates.TemplateResponse("chat.html",
                                      {"request": request, "user": user_data, 'users_all': get_chat_page.users_cache})


# Получение сообщений между текущим пользователем и другим пользователем
@router.get("/messages/{user_id}", response_model=List[MessageRead])
async def get_messages(user_id: int, current_user: User = Depends(get_current_user)):
    # Получение сообщений между пользователями
    return await MessagesDAO.get_messages_between_users(user_id_1=user_id, user_id_2=current_user.id) or []


# Отправка сообщения от текущего пользователя
@router.post("/messages", response_model=MessageCreate)
async def send_message(message: MessageCreate, current_user: User = Depends(get_current_user)):
    # Добавление нового сообщения в базу данных
    await MessagesDAO.add(
        sender_id=current_user.id,
        content=message.content,
        recipient_id=message.recipient_id
    )
    # Оповещение получателя через WebSocket
    await notify_user(message.recipient_id, f"New message from {current_user.id}: {message.content}")

    # Возвращаем данные об отправленном сообщении
    return {'recipient_id': message.recipient_id, 'content': message.content, 'status': 'ok', 'msg': 'Message saved!'}
