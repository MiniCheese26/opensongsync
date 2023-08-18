import { SpotifyClient } from '$lib/server/spotify';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET = (async () => {
  const s = await SpotifyClient.initialise();

  if (!s) {
    throw error(400, '');
  }

  await s.fetchTracks();

  return new Response('', {
    status: 200,
  });
})  satisfies RequestHandler;
