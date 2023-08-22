import { ConnectionClient, TrackItem } from './connectionClient';
import dayjs from 'dayjs';
import db from './db';
import { TIDAL_CLIENT_ID, TIDAL_CLIENT_SECRET } from '$lib/tidal';

type TidalResponse<T> = {
  limit: number;
  offset: number;
  totalNumberOfItems: number;
  items: T[];
};

type TidalApiSavedTrack = {
  created: string;
  item: TidalApiTrackItem;
};

type TidalApiTrackItem = {
  title: string;
  id: number;
  album: {
    title: string;
  };
  artists: {
    name: string;
  }[];
  url: string;
  isrc: string;
  streamStartDate: string;
};

type TidalSearchTypes = 'artists' | 'albums' | 'tracks' | 'playlists';

type TidalApiSearchResponse = {
  albums: TidalResponse<unknown>;
  artists: TidalResponse<unknown>;
  playlists: TidalResponse<unknown>;
  tracks: TidalResponse<TidalApiTrackItem>;
};

type TidalSearchResponse = {
  albums: TidalResponse<unknown>;
  artists: TidalResponse<unknown>;
  playlists: TidalResponse<unknown>;
  tracks: TidalResponse<TidalTrackItem>;
};

const getDefaultTidalResponse = (limit: number, offset: number) => ({
  limit,
  offset,
  totalNumberOfItems: 0,
  items: [],
});

class TidalTrackItem extends TrackItem {
  static parse(data: TidalApiTrackItem) {
    const year = dayjs(data.streamStartDate).get('year').toString();

    return new TidalTrackItem(
      data.title,
      data.id,
      data.album.title,
      data.artists.map((artist) => artist.name),
      data.url,
      year,
      data.isrc,
    );
  }
}

export class TidalClient extends ConnectionClient {
  protected readonly API_BASE = 'https://api.tidal.com/v1';

  constructor(
    accessToken: string,
    private userId: string,
    private countryCode: string,
  ) {
    super(accessToken);
  }

  static async initialise(): Promise<TidalClient | null> {
    const accessToken = await db.tidalAccessTokens.findFirst();

    if (!accessToken) {
      return null;
    }

    if (dayjs().isAfter(dayjs(accessToken.expiresAt))) {
      console.debug('refreshing token');
      const qs = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: accessToken.refreshToken,
        client_id: TIDAL_CLIENT_ID,
        scope: 'r_usr+w_usr+w_sub',
      });

      const res = await fetch('https://auth.tidal.com/v1/oauth/token' + qs, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${btoa(TIDAL_CLIENT_ID + ':' + TIDAL_CLIENT_SECRET)}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (!res.ok) {
        return null;
      }

      const body = await res.json();

      await db.tidalAccessTokens.update({
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

    return new TidalClient(
      accessToken.accessToken,
      accessToken.userId.toString(),
      accessToken.countryCode,
    );
  }

  protected makeUrl(path: string, qs?: Record<string, string | number>): string {
    if (qs) {
      qs.countryCode = this.countryCode;
    } else {
      qs = {
        countryCode: this.countryCode,
      };
    }

    return super.makeUrl(path, qs);
  }

  async fetchUserTracks(
    limit = 50,
    offset = 0,
    order = 'DATE',
    orderDirection = 'DESC',
  ): Promise<TidalResponse<TidalTrackItem>> {
    const res = await this.makeRequest<TidalResponse<TidalApiSavedTrack>>(
      `/users/${this.userId}/favorites/tracks`,
      {
        qs: {
          offset,
          limit,
          order,
          orderDirection,
        },
      },
    );

    if (!res?.response.ok || !res.data) {
      return getDefaultTidalResponse(limit, offset);
    }

    return {
      ...res.data,
      items: res.data.items.map((item) => TidalTrackItem.parse(item.item)),
    };
  }

  async search(
    query: string,
    types: TidalSearchTypes[] = ['albums', 'artists', 'tracks', 'playlists'],
    limit = 50,
    offset = 0,
  ): Promise<TidalSearchResponse> {
    const res = await this.makeRequest<TidalApiSearchResponse>('/search', {
      qs: {
        query,
        limit,
        offset,
        types: types.map((type) => type.toUpperCase()).join(','),
      },
    });

    if (!res?.response.ok || !res.data) {
      return {
        artists: getDefaultTidalResponse(limit, offset),
        albums: getDefaultTidalResponse(limit, offset),
        tracks: getDefaultTidalResponse(limit, offset),
        playlists: getDefaultTidalResponse(limit, offset),
      };
    }

    // TODO: finish the rest of these once we have album, artist and playlist parsing done
    return {
      ...res.data,
      tracks: {
        ...res.data.tracks,
        items: res.data.tracks.items.map((item) => TidalTrackItem.parse(item)),
      },
    };
  }

  async saveTracks(...ids: string[]) {
    const res = await this.makeRequest(
      `/users/${this.userId}/favorites/tracks`,
      {
        // :|
        raw: `trackIds=${ids.join(',')}`,
      },
      'POST',
      {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    );

    return !!res?.response.ok;
  }
}
