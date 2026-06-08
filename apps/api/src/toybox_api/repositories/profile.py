from dataclasses import dataclass

import asyncpg

from toybox_api.config import Settings, get_settings


@dataclass(frozen=True)
class ProfileStatsRecord:
    posts: int
    followers: int
    following: int


@dataclass(frozen=True)
class ProfileBadgeRecord:
    description: str
    text: str


@dataclass(frozen=True)
class ProfileToyRecord:
    id: str
    media_path: str
    caption: str | None = None
    is_absolute_url: bool = False


@dataclass(frozen=True)
class ProfileRecord:
    id: str
    name: str
    handle: str
    avatar_path: str
    bio: str
    stats: ProfileStatsRecord
    badges: list[ProfileBadgeRecord]
    toys: list[ProfileToyRecord]


MockProfile = ProfileRecord(
    id="1",
    name="Gabriel",
    handle="@gabriel",
    avatar_path="mocks/avatar.png",
    bio="Toy collector, daily discoveries, and tiny worlds from Toybox.",
    stats=ProfileStatsRecord(
        posts=9,
        followers=1248,
        following=312,
    ),
    badges=[
        ProfileBadgeRecord(
            description="Pega um bixo por dia",
            text="FIRE",
        ),
        ProfileBadgeRecord(
            description="Perfil em destaque",
            text="STAR",
        ),
        ProfileBadgeRecord(
            description="Colecao crescendo",
            text="RARE",
        ),
    ],
    toys=[
        ProfileToyRecord(
            id="toy-1",
            media_path="mocks/toy-1.png",
            caption="Newest catch",
        ),
        ProfileToyRecord(
            id="toy-2",
            media_path="mocks/toy-2.png",
            caption="Shelf favorite",
        ),
        ProfileToyRecord(
            id="toy-3",
            media_path="mocks/toy-3.png",
            caption="Weekend pull",
        ),
        ProfileToyRecord(
            id="toy-4",
            media_path="mocks/toy-4.png",
            caption="Trade find",
        ),
        ProfileToyRecord(
            id="toy-5",
            media_path="mocks/toy-5.png",
            caption="Desk buddy",
        ),
        ProfileToyRecord(
            id="toy-6",
            media_path="mocks/toy-6.png",
            caption="Fresh box",
        ),
        ProfileToyRecord(
            id="toy-7",
            media_path="mocks/toy-7.png",
            caption="Rare colorway",
        ),
        ProfileToyRecord(
            id="toy-8",
            media_path="mocks/toy-8.png",
            caption="Tiny scene",
        ),
        ProfileToyRecord(
            id="toy-9",
            media_path="mocks/toy-9.png",
            caption="Collection wall",
        ),
    ],
)


class ProfileRepository:
    def __init__(self, settings: Settings | None = None) -> None:
        self.settings = settings or get_settings()

    async def get_profile(self) -> ProfileRecord:
        uploaded_toys = await self.list_uploaded_toys()

        return ProfileRecord(
            id=MockProfile.id,
            name=MockProfile.name,
            handle=MockProfile.handle,
            avatar_path=MockProfile.avatar_path,
            bio=MockProfile.bio,
            stats=ProfileStatsRecord(
                posts=MockProfile.stats.posts + len(uploaded_toys),
                followers=MockProfile.stats.followers,
                following=MockProfile.stats.following,
            ),
            badges=MockProfile.badges,
            toys=[*uploaded_toys, *MockProfile.toys],
        )

    async def list_uploaded_toys(self) -> list[ProfileToyRecord]:
        try:
            connection = await asyncpg.connect(self.settings.database_url)
        except (OSError, asyncpg.PostgresError):
            return []

        try:
            rows = await connection.fetch(
                """
                select id, name, image_url
                from toy
                order by created_at desc
                """
            )
        except asyncpg.PostgresError:
            return []
        finally:
            await connection.close()

        return [
            ProfileToyRecord(
                id=str(row["id"]),
                media_path=row["image_url"],
                caption=row["name"],
                is_absolute_url=True,
            )
            for row in rows
        ]
