import { PUBLIC_DOMAIN, PUBLIC_HTTPS } from '$env/static/public';

export const getDomain = () => {
	const prefix = PUBLIC_HTTPS.toLowerCase() === 'true' ? 'https://' : 'http://';

	return prefix + PUBLIC_DOMAIN;
};
