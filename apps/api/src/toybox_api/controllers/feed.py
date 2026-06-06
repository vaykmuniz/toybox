from fastapi import APIRouter
from fastapi.requests import Request

from toybox_api.models.feed import GetFeed
from toybox_api.services.feed import FeedService

router = APIRouter()
service = FeedService()


@router.get("/feed", response_model=GetFeed)
async def feed(request: Request) -> GetFeed:
    return await service.get_feed(request)
