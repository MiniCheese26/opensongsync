import db from '$lib/server/db';
import dayjs from 'dayjs';
import type { RequestHandler } from './$types';

export const POST = (async ({ request }) => {
  const data = await request.json();

  await db.tidalAccessTokens.create({
    data: {
      ...data,
      expiresAt: dayjs().add(data.expiresAt, 'seconds').toDate(),
    },
  });

  return new Response(null, {
    status: 201,
  });
}) satisfies RequestHandler;
