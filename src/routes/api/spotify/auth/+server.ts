import {redirect} from '@sveltejs/kit';
import db from '$lib/server/db';
import dayjs from 'dayjs';
import { getDomain } from '$lib/utils';
import { SPOTIFY_CLIENT_SECRET } from '$env/static/private';
import { PUBLIC_SPOTIFY_CLIENT_ID } from '$env/static/public';
import type { RequestHandler } from "./$types";

export const GET = (async ({ url }) => {
  const params = url.searchParams;

  const code = params.get('code');

  if (!code) {
    throw redirect(303, '/?failed=true');
  }

  const qs = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: `${getDomain()}/api/spotify/auth`,
  });

  const res = await fetch('https://accounts.spotify.com/api/token?' + qs, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${btoa(PUBLIC_SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  if (!res.ok) {
    throw redirect(303, '/?failed=true');
  }

  const body = await res.json();

  await db.spotifyAuthorisationCodes.create({
    data: {
      code,
    },
  });

  await db.spotifyAccessTokens.create({
    data: {
      accessToken: body.access_token,
      refreshToken: body.refresh_token,
      expiresAt: dayjs().add(body.expires_in, 'seconds').toDate(),
    },
  });

  throw redirect(303, '/');
}) satisfies RequestHandler;
