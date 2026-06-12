from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from toybox_api.controllers import auth, health, odds, profile, toys
from toybox_api.observability import initialize_sentry

initialize_sentry()
app = FastAPI(title="Toybox API")
StaticDirectory = Path(__file__).parent / "static"

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)
app.mount("/static", StaticFiles(directory=StaticDirectory), name="static")
app.include_router(health.router)
app.include_router(auth.router)
app.include_router(profile.router)
app.include_router(toys.router)
app.include_router(odds.router)


@app.get("/sentry-debug")
async def trigger_error() -> None:
    _ = 1 / 0
