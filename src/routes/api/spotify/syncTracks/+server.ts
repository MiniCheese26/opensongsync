import { makeEmitData } from '$lib/server/serverUtils';
import { SpotifyClient } from '$lib/server/spotify';
import type { SpotifySyncTracksEvent } from '$lib/sse';
import type { RequestHandler } from './$types';
import { events } from 'sveltekit-sse';

export const GET = (async () => {
  return events(async (emit) => {
    const client = await SpotifyClient.initialise();

    if (!client) {
      emit(
        'spotify:syncTracks:error',
        JSON.stringify({
          message: ':(',
        }),
      );
      return;
    }

    const limit = 50;
    let total = -1;
    let offset = 0;

    while (offset + limit <= total || total === -1) {
      console.debug('request');
      const res = await client.fetchUserTracks(limit, offset);

      if (!res.success) {
        emit(
          'spotify:syncTracks:error',
          JSON.stringify({
            message: ':(',
          }),
        );
        return;
      }

      total = res.total;

      emit(
        'spotify:syncTracks:progress',
        makeEmitData<SpotifySyncTracksEvent>({
          total: res.total,
          items: res.items.map((item) => item.toJson()),
          perPage: limit,
          page: (offset / limit) + 1,
          totalPages: Math.ceil(total / limit),
        }),
      );

      offset += limit;
    }
  }).toResponse();
}) satisfies RequestHandler;
