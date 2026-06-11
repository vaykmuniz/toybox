from pydantic import BaseModel


class RecentCatchOwner(BaseModel):
    id: str
    name: str | None
    handle: str
    avatar_url: str | None


class RecentCatch(BaseModel):
    id: str
    name: str
    media_url: str
    tries: int
    created_at: str
    owner: RecentCatchOwner
