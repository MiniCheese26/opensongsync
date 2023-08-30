import { SpotifyClient } from '$lib/server/spotify';
import type { RequestHandler } from './$types';
import { events } from 'sveltekit-sse';

export const GET = (async () => {
  return events(async (emit) => {
    const s = await SpotifyClient.initialise();

    if (!s) {
      emit(
        'spotify:userTracks:error',
        JSON.stringify({
          message: ':(',
        }),
      );
      return;
    }

    const limit = 50;

    const firstResponse = await s.fetchUserTracks(limit);

    if (!firstResponse.success) {
      emit(
        'spotify:userTracks:error',
        JSON.stringify({
          message: ':(',
        }),
      );
      return;
    }

    emit(
      'spotify:userTracks:progress',
      JSON.stringify({
        total: firstResponse.total,
        items: firstResponse.items.map((item) => item.toJson()),
      }),
    );

    const total = firstResponse.total;
    let offset = limit;

    while (offset + limit <= total) {
      console.debug('request');
      const res = await s.fetchUserTracks(limit, offset);

      if (!res.success) {
        emit(
          'spotify:userTracks:error',
          JSON.stringify({
            message: ':(',
          }),
        );
        return;
      }

      emit(
        'spotify:userTracks:progress',
        JSON.stringify({
          total: res.total,
          items: res.items.map((item) => item.toJson()),
        }),
      );

      offset += limit;
    }
  }).toResponse();
}) satisfies RequestHandler;
