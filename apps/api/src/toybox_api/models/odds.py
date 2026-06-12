from pydantic import BaseModel


class RecentCatchOwner(BaseModel):
    id: str
    name: str | None
    handle: str
    avatar_url: str | None


class RecentCatch(BaseModel):
    id: str
    description: str
    media_url: str | None
    tries: int
    cost_per_try: int
    caught: bool
    created_at: str
    owner: RecentCatchOwner
