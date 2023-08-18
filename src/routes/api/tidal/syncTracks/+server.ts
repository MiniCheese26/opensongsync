import type { RequestHandler } from './$types';
import {error, json} from "@sveltejs/kit";
import {TidalClient} from "$lib/server/tidal";

export const GET = (async () => {
    const s = await TidalClient.initialise();

    if (!s) {
        throw error(400, '');
    }

    const k = await s.fetchUserTracks();

    return json(k);
}) satisfies RequestHandler;