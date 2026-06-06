from dataclasses import dataclass


@dataclass(frozen=True)
class FeedAuthorRecord:
    id: str
    name: str
    handle: str
    avatar_path: str


@dataclass(frozen=True)
class FeedItemRecord:
    id: str
    author: FeedAuthorRecord
    media_path: str
    caption: str
    location: str
    posted_at: str


MockFeedItems = [
    FeedItemRecord(
        id="feed-1",
        author=FeedAuthorRecord(
            id="user-1",
            name="Gabriel",
            handle="@gabriel",
            avatar_path="mocks/avatar.png",
        ),
        media_path="mocks/toy-1.png",
        caption="Newest pull found a spot on the shelf.",
        location="Sao Paulo, BR",
        posted_at="2026-06-06T12:00:00.000Z",
    ),
    FeedItemRecord(
        id="feed-2",
        author=FeedAuthorRecord(
            id="user-2",
            name="Lia",
            handle="@lia_collects",
            avatar_path="mocks/avatar.png",
        ),
        media_path="mocks/toy-5.png",
        caption="Desk buddy rotation for the week.",
        location="Curitiba, BR",
        posted_at="2026-06-05T18:30:00.000Z",
    ),
    FeedItemRecord(
        id="feed-3",
        author=FeedAuthorRecord(
            id="user-3",
            name="Nico",
            handle="@tinyworlds",
            avatar_path="mocks/avatar.png",
        ),
        media_path="mocks/toy-9.png",
        caption="Collection wall finally has room for one more.",
        location="Porto Alegre, BR",
        posted_at="2026-06-04T21:15:00.000Z",
    ),
]


class FeedRepository:
    async def list_feed_items(self) -> list[FeedItemRecord]:
        return MockFeedItems.copy()
