from fastapi import APIRouter

from toybox_api.models.auth import (
    LoginRequest,
    LoginResponse,
    RegisterRequest,
    RegisterResponse,
    VerifyRegisterRequest,
    VerifyRegisterResponse,
)
from toybox_api.services.auth import AuthService

router = APIRouter()
service = AuthService()


@router.post("/register", response_model=RegisterResponse, status_code=201)
async def register(payload: RegisterRequest) -> RegisterResponse:
    return await service.register(payload)


@router.post("/register/verify", response_model=VerifyRegisterResponse)
async def verify_register(payload: VerifyRegisterRequest) -> VerifyRegisterResponse:
    return await service.verify_register(payload)


@router.get("/register/verify", response_model=VerifyRegisterResponse)
async def verify_register_link(username: str, token: str) -> VerifyRegisterResponse:
    return await service.verify_register(VerifyRegisterRequest(username=username, token=token))


@router.post("/login", response_model=LoginResponse)
async def login(payload: LoginRequest) -> LoginResponse:
    return await service.login(payload)
