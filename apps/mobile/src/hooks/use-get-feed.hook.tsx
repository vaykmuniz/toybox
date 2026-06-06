import type { ImageProps } from 'expo-image';

type FeedImageSource = ImageProps['source'];

export interface GetFeed {
  items: FeedItem[];
}

export interface FeedItem {
  id: string;
  author: FeedAuthor;
  media_url: FeedImageSource;
  caption: string;
  location: string;
  posted_at: string;
}

export interface FeedAuthor {
  id: string;
  name: string;
  handle: string;
  avatar_url: FeedImageSource;
}

export const useGetFeed = (): GetFeed => {
  return {
    items: [
      {
        id: 'feed-1',
        author: {
          id: 'user-1',
          name: 'Gabriel',
          handle: '@gabriel',
          avatar_url: require('@/assets/images/mocks/avatar.png'),
        },
        media_url: require('@/assets/images/mocks/toy-1.png'),
        caption: 'Newest pull found a spot on the shelf.',
        location: 'Sao Paulo, BR',
        posted_at: '2026-06-06T12:00:00.000Z',
      },
      {
        id: 'feed-2',
        author: {
          id: 'user-2',
          name: 'Lia',
          handle: '@lia_collects',
          avatar_url: require('@/assets/images/mocks/avatar.png'),
        },
        media_url: require('@/assets/images/mocks/toy-5.png'),
        caption: 'Desk buddy rotation for the week.',
        location: 'Curitiba, BR',
        posted_at: '2026-06-05T18:30:00.000Z',
      },
      {
        id: 'feed-3',
        author: {
          id: 'user-3',
          name: 'Nico',
          handle: '@tinyworlds',
          avatar_url: require('@/assets/images/mocks/avatar.png'),
        },
        media_url: require('@/assets/images/mocks/toy-9.png'),
        caption: 'Collection wall finally has room for one more.',
        location: 'Porto Alegre, BR',
        posted_at: '2026-06-04T21:15:00.000Z',
      },
    ],
  };
};
