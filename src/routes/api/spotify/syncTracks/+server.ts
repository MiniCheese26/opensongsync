import { SpotifyClient } from '$lib/server/spotify';
import { error } from '@sveltejs/kit';

export const GET = async () => {
	const s = await SpotifyClient.initialise();

	if (!s) {
		throw error(400, '');
	}

	await s.fetchAllTracks();

	return new Response('', {
		status: 200,
	});
};
