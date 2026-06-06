from fastapi.requests import Request

from toybox_api.models.feed import FeedAuthor, FeedItem, GetFeed
from toybox_api.repositories.feed import FeedItemRecord, FeedRepository


class FeedService:
    def __init__(self, repository: FeedRepository | None = None) -> None:
        self.repository = repository or FeedRepository()

    async def get_feed(self, request: Request) -> GetFeed:
        items = await self.repository.list_feed_items()
        return GetFeed(items=[self._feed_item_response(request, item) for item in items])

    def _static_url(self, request: Request, path: str) -> str:
        return str(request.url_for("static", path=path))

    def _feed_item_response(self, request: Request, item: FeedItemRecord) -> FeedItem:
        return FeedItem(
            id=item.id,
            author=FeedAuthor(
                id=item.author.id,
                name=item.author.name,
                handle=item.author.handle,
                avatar_url=self._static_url(request, item.author.avatar_path),
            ),
            media_url=self._static_url(request, item.media_path),
            caption=item.caption,
            location=item.location,
            posted_at=item.posted_at,
        )
