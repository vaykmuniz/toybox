from dataclasses import dataclass


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
    async def get_profile(self) -> ProfileRecord:
        return MockProfile
