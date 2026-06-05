interface GetProfile {
  id: string;
  name: string;
  handle: string;
  avatar_url: string;
  bio: string;
  stats: ProfileStats;
  badges: Badge[];
  toys: Toy[];
}

interface ProfileStats {
  posts: number;
  followers: number;
  following: number;
}

interface Toy {
  id: string;
  media_url: string;
  caption?: string;
}

interface Badge {
  description: string;
  text: string;
}

export const useGetProfile = (): GetProfile => {
  return {
    id: '1',
    name: 'Gabriel',
    handle: '@gabriel',
    avatar_url: 'https://picsum.photos/seed/toybox-avatar/300/300',
    bio: 'Toy collector, daily discoveries, and tiny worlds from Toybox.',
    stats: {
      posts: 9,
      followers: 1248,
      following: 312,
    },
    badges: [
      {
        description: 'Pega um bixo por dia',
        text: 'FIRE',
      },
      {
        description: 'Perfil em destaque',
        text: 'STAR',
      },
      {
        description: 'Colecao crescendo',
        text: 'RARE',
      },
    ],
    toys: [
      {
        id: 'toy-1',
        media_url: 'https://picsum.photos/seed/toybox-1/400/400',
        caption: 'Newest catch',
      },
      {
        id: 'toy-2',
        media_url: 'https://picsum.photos/seed/toybox-2/400/400',
        caption: 'Shelf favorite',
      },
      {
        id: 'toy-3',
        media_url: 'https://picsum.photos/seed/toybox-3/400/400',
        caption: 'Weekend pull',
      },
      {
        id: 'toy-4',
        media_url: 'https://picsum.photos/seed/toybox-4/400/400',
        caption: 'Trade find',
      },
      {
        id: 'toy-5',
        media_url: 'https://picsum.photos/seed/toybox-5/400/400',
        caption: 'Desk buddy',
      },
      {
        id: 'toy-6',
        media_url: 'https://picsum.photos/seed/toybox-6/400/400',
        caption: 'Fresh box',
      },
      {
        id: 'toy-7',
        media_url: 'https://picsum.photos/seed/toybox-7/400/400',
        caption: 'Rare colorway',
      },
      {
        id: 'toy-8',
        media_url: 'https://picsum.photos/seed/toybox-8/400/400',
        caption: 'Tiny scene',
      },
      {
        id: 'toy-9',
        media_url: 'https://picsum.photos/seed/toybox-9/400/400',
        caption: 'Collection wall',
      },
    ],
  };
};
