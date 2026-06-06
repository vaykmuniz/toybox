from fastapi import APIRouter
from fastapi.requests import Request

from toybox_api.models.feed import FeedAuthor, FeedItem, GetFeed
from toybox_api.repositories.feed import FeedItemRecord, FeedRepository

router = APIRouter()


def static_url(request: Request, path: str) -> str:
    return str(request.url_for("static", path=path))


def feed_item_response(request: Request, item: FeedItemRecord) -> FeedItem:
    return FeedItem(
        id=item.id,
        author=FeedAuthor(
            id=item.author.id,
            name=item.author.name,
            handle=item.author.handle,
            avatar_url=static_url(request, item.author.avatar_path),
        ),
        media_url=static_url(request, item.media_path),
        caption=item.caption,
        location=item.location,
        posted_at=item.posted_at,
    )


@router.get("/feed", response_model=GetFeed)
async def feed(request: Request) -> GetFeed:
    repository = FeedRepository()
    items = await repository.list_feed_items()
    return GetFeed(items=[feed_item_response(request, item) for item in items])
