import { ConnectionClient, TrackItem } from './connectionClient';
import { SPOTIFY_CLIENT_SECRET } from '$env/static/private';
import dayjs from 'dayjs';
import db from './db';
import { PUBLIC_SPOTIFY_CLIENT_ID } from '$env/static/public';

type SpotifySearchResponse<T> = {
  limit: number;
  offset: number;
  total: number;
  items: T[];
};

type SpotifyApiSavedTrack = {
  track: SpotifyApiTrackItem;
};

type SpotifyApiTrackItem = {
  album: {
    name: string;
    release_date: string;
  };
  artists: {
    name: string;
  }[];
  href: string;
  name: string;
  id: string;
  external_ids: {
    isrc: string;
  };
};

const getDefaultSpotifyResponse = (limit: number, offset: number) => ({
  limit,
  offset,
  total: 0,
  items: [],
});

class SpotifyTrackItem extends TrackItem {
  static parse(data: SpotifyApiTrackItem) {
    const year = data.album.release_date.split('-')[0];

    return new SpotifyTrackItem(
      data.name,
      data.id,
      data.album.name,
      data.artists.map((artist) => artist.name),
      data.href,
      year,
      data.external_ids.isrc,
    );
  }
}

export class SpotifyClient extends ConnectionClient {
  protected readonly API_BASE = 'https://api.spotify.com/v1';

  static async initialise(): Promise<SpotifyClient | null> {
    const accessToken = await db.spotifyAccessTokens.findFirst();

    if (!accessToken) {
      return null;
    }

    if (dayjs().isAfter(dayjs(accessToken.expiresAt))) {
      console.debug('refreshing token');
      const qs = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: accessToken.refreshToken,
      });

      const res = await fetch('https://accounts.spotify.com/api/token?' + qs, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${btoa(PUBLIC_SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET)}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (!res.ok) {
        return null;
      }

      const body = await res.json();

      await db.spotifyAccessTokens.update({
        where: {
          id: accessToken.id,
        },
        data: {
          accessToken: body.access_token,
          expiresAt: dayjs().add(body.expires_in, 'seconds').toDate(),
        },
      });

      accessToken.accessToken = body.access_token;
    }

    return new SpotifyClient(accessToken.accessToken);
  }

  async fetchUserTracks(limit = 50, offset = 0): Promise<SpotifySearchResponse<SpotifyTrackItem>> {
    const safeLimit = limit > 50 ? 50 : limit;

    const res = await this.makeRequest<SpotifySearchResponse<SpotifyApiSavedTrack>>('/me/tracks', {
      qs: { limit: safeLimit, offset },
    });

    if (!res?.response.ok || !res.data) {
      return getDefaultSpotifyResponse(safeLimit, offset);
    }

    return {
      ...res.data,
      items: res.data.items.map((item) => SpotifyTrackItem.parse(item.track)),
    };
  }

  async search(
    query: string,
    type: 'track',
    limit = 50,
    offset = 0,
  ): Promise<SpotifySearchResponse<SpotifyApiTrackItem>> {
    const safeLimit = limit > 50 ? 50 : limit;

    const res = await this.makeRequest<SpotifySearchResponse<SpotifyApiTrackItem>>('/search', {
      qs: {
        q: query,
        type,
        limit: safeLimit,
        offset,
      },
    });

    if (!res?.response.ok || !res.data) {
      return getDefaultSpotifyResponse(safeLimit, offset);
    }

    return res.data;
  }

  async searchForTracks(
    query: string,
    limit = 50,
    offset = 0,
  ): Promise<SpotifySearchResponse<SpotifyTrackItem>> {
    const data = await this.search(query, 'track', limit, offset);

    return {
      ...data,
      items: data.items.map((item) => SpotifyTrackItem.parse(item)),
    };
  }

  async saveTracks(...ids: string[]) {
    const res = await this.makeRequest(
      '/me/tracks',
      {
        qs: {
          ids: ids.join(','),
        },
      },
      'PUT',
    );

    return !!res?.response.ok;
  }
}
