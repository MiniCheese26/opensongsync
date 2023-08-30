import type { source } from 'sveltekit-sse';
import type { SpotifyTrackItem } from './server/spotify';

export type Connection = ReturnType<typeof source>;
export type Selection = ReturnType<Connection['select']>;

// Spotify Events

export type SpotifySyncTracksEvent = {
  total: number;
  items: ReturnType<SpotifyTrackItem['toJson']>[];
  perPage: number;
  page: number;
  totalPages: number;
};
