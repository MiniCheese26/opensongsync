import { SPOTIFY_CLIENT_ID } from '$lib/spotify';
import dayjs from 'dayjs';
import { ConnectionClient, type IConnectionClient, type Track } from './connectionClient';
import db from './db';

export const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

type SpotifyApiTrackItem = {
	album: {
		name: string;
	};
	artists: {
		name: string;
	}[];
	href: string;
	name: string;
	id: string;
};

export class SpotifyClient extends ConnectionClient implements IConnectionClient<Track> {
	protected readonly API_BASE = 'https://api.spotify.com/v1';

	constructor(accessToken: string) {
		super(accessToken);
	}

	static async initialise(): Promise<SpotifyClient | null> {
		const accessToken = await db.spotifyConnections.findFirst();

		if (!accessToken) {
			return null;
		}

		if (dayjs().isAfter(dayjs(accessToken.expiresAt))) {
			const qs = new URLSearchParams({
				grant_type: 'refresh_token',
				refresh_token: accessToken.refreshToken
			});

			const res = await fetch('https://accounts.spotify.com/api/token?' + qs, {
				method: 'POST',
				headers: {
					Authorization: `Basic ${btoa(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET)}`,
					'Content-Type': 'application/x-www-form-urlencoded'
				}
			});

			if (!res.ok) {
				return null;
			}

			const body = await res.json();

			await db.spotifyConnections.update({
				where: {
					id: accessToken.id
				},
				data: {
					accessToken: body.access_token,
					expiresAt: dayjs().add(body.expires_in, 'seconds').toDate()
				}
			});

			accessToken.accessToken = body.access_token;
		}

		return new SpotifyClient(accessToken.accessToken);
	}

	async fetchAllTracks() {
		const tracks: Track[] = [];
		let offset = 0;
		let res;

		while (
			(res = await this.makeRequest('/me/tracks', { qs: { limit: 50, offset } }))?.data?.next
		) {
			offset += 50;

			const items = res.data.items as Record<string, unknown>[];

			items.forEach((item) => {
				const trackItem = item.track as SpotifyApiTrackItem;

				tracks.push({
					id: trackItem.id,
					name: trackItem.name,
					album: trackItem.album.name,
					href: trackItem.href,
					artists: trackItem.artists.map((artist) => artist.name)
				});
			});

			console.debug(tracks);

			await new Promise((resolve) => {
				setTimeout(resolve, 2000000);
			});
		}

		console.debug(res);

		if (!res || !res?.response.ok) {
			// smth went wrong
			return null;
		}

		return tracks;
	}
}
