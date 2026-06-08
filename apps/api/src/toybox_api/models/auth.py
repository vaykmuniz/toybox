from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field, field_validator


class RegisterRequest(BaseModel):
    email: EmailStr
    username: str = Field(min_length=1, max_length=30)
    name: str = Field(min_length=1, max_length=255)
    password: str = Field(min_length=1, max_length=255)

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip().lower()

        return value

    @field_validator("username", "name", mode="before")
    @classmethod
    def trim_text(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip()

        return value


class RegisterResponse(BaseModel):
    id: str
    email: str
    username: str
    name: str
    token_expires_at: datetime


class VerifyRegisterRequest(BaseModel):
    username: str = Field(min_length=1, max_length=30)
    token: str = Field(min_length=1, max_length=255)

    @field_validator("username", "token", mode="before")
    @classmethod
    def trim_text(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip()

        return value


class VerifyRegisterResponse(BaseModel):
    id: str
    username: str
    verified: bool


class LoginRequest(BaseModel):
    username: str = Field(min_length=1, max_length=30)
    password: str = Field(min_length=1, max_length=255)

    @field_validator("username", mode="before")
    @classmethod
    def trim_username(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip()

        return value


class LoginResponse(BaseModel):
    id: str
    email: str
    username: str
    name: str
    access_token: str
    token_type: Literal["bearer"]
    expires_at: datetime
