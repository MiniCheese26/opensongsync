export const getDomain = () => {
	const prefix = process.env.HTTPS?.toLowerCase() === 'true' ? 'https://' : 'http://';

	return prefix + process.env.DOMAIN;
};
