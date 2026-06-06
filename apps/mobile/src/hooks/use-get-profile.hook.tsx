import type { ImageProps } from 'expo-image';

type ProfileImageSource = ImageProps['source'];

export interface GetProfile {
  id: string;
  name: string;
  handle: string;
  avatar_url: ProfileImageSource;
  bio: string;
  stats: ProfileStats;
  badges: Badge[];
  toys: Toy[];
}

export interface ProfileStats {
  posts: number;
  followers: number;
  following: number;
}

export interface Toy {
  id: string;
  media_url: ProfileImageSource;
  caption?: string;
}

export interface Badge {
  description: string;
  text: string;
}

export const useGetProfile = (): GetProfile => {
  return {
    id: '1',
    name: 'Gabriel',
    handle: '@gabriel',
    avatar_url: require('@/assets/images/mocks/avatar.png'),
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
        media_url: require('@/assets/images/mocks/toy-1.png'),
        caption: 'Newest catch',
      },
      {
        id: 'toy-2',
        media_url: require('@/assets/images/mocks/toy-2.png'),
        caption: 'Shelf favorite',
      },
      {
        id: 'toy-3',
        media_url: require('@/assets/images/mocks/toy-3.png'),
        caption: 'Weekend pull',
      },
      {
        id: 'toy-4',
        media_url: require('@/assets/images/mocks/toy-4.png'),
        caption: 'Trade find',
      },
      {
        id: 'toy-5',
        media_url: require('@/assets/images/mocks/toy-5.png'),
        caption: 'Desk buddy',
      },
      {
        id: 'toy-6',
        media_url: require('@/assets/images/mocks/toy-6.png'),
        caption: 'Fresh box',
      },
      {
        id: 'toy-7',
        media_url: require('@/assets/images/mocks/toy-7.png'),
        caption: 'Rare colorway',
      },
      {
        id: 'toy-8',
        media_url: require('@/assets/images/mocks/toy-8.png'),
        caption: 'Tiny scene',
      },
      {
        id: 'toy-9',
        media_url: require('@/assets/images/mocks/toy-9.png'),
        caption: 'Collection wall',
      },
    ],
  };
};
