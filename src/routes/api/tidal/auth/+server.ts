import db from '$lib/server/db';
import dayjs from 'dayjs';

export const POST = async ({ request }) => {
	const data = await request.json();

	await db.tidalConnections.create({
		data: {
			...data,
			expiresAt: dayjs().add(data.expiresAt, 'seconds').toDate()
		}
	});

	return new Response(null, {
		status: 201
	});
};
