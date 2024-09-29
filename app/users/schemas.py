from pydantic import BaseModel, EmailStr, Field


class SUserRegister(BaseModel):
    email: EmailStr = Field(..., description="Электронная почта")
    password: str = Field(..., min_length=5, max_length=50, description="Пароль, от 5 до 50 знаков")
    password_check: str = Field(..., min_length=5, max_length=50, description="Пароль, от 5 до 50 знаков")
    name: str = Field(..., min_length=3, max_length=50, description="Имя, от 3 до 50 символов")


class SUserAuth(BaseModel):
    email: EmailStr = Field(..., description="Электронная почта")
    password: str = Field(..., min_length=5, max_length=50, description="Пароль, от 5 до 50 знаков")


class SUserRead(BaseModel):
    id: int = Field(..., description="Идентификатор пользователя")
    name: str = Field(..., min_length=3, max_length=50, description="Имя, от 3 до 50 символов")
