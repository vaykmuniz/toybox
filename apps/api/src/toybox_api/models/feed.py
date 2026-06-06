from pydantic import BaseModel


class FeedAuthor(BaseModel):
    id: str
    name: str
    handle: str
    avatar_url: str


class FeedItem(BaseModel):
    id: str
    author: FeedAuthor
    media_url: str
    caption: str
    location: str
    posted_at: str


class GetFeed(BaseModel):
    items: list[FeedItem]
