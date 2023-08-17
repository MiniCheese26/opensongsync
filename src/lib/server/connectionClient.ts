export type RequestData = {
	body?: Record<string, unknown> | unknown[];
	qs?: Record<string, string | number>;
};

export type Methods = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'OPTIONS';

export type ConnectionResponse<T> = {
	response: Response;
	data: T;
};

export type Track = {
	id: string | number;
	name: string;
	album: string;
	artists: string[];
	href: string;
};

export class TrackItem {
	album: string;
	artists: string[];
	name: string;
	id: string | number;
	href: string;
	year?: string;
	isrc?: string;

	constructor(
		name: string,
		id: string | number,
		album: string,
		artists: string[],
		href: string,
		year?: string,
		isrc?: string,
	) {
		this.name = name;
		this.id = id;
		this.album = album;
		this.artists = artists;
		this.href = href;
		this.year = year;
		this.isrc = isrc;
	}
}

export abstract class ConnectionClient {
	protected abstract readonly API_BASE: string;
	protected accessToken: string;

	constructor(accessToken: string) {
		this.accessToken = accessToken;
	}

	protected makeUrl(path: string, qs?: Record<string, string | number>) {
		const url = new URL(this.API_BASE + path);

		if (qs) {
			Object.entries(qs).forEach(([k, v]) => {
				url.searchParams.append(k, String(v));
			});
		}

		return url.href;
	}

	protected makeHeaders(contentType?: string): Record<string, string> {
		const headers = {
			Authorization: `Bearer ${this.accessToken}`,
		} as {
			Authorization: string;
			'Content-Type'?: string;
		};

		if (contentType) {
			headers['Content-Type'] = contentType;
		}

		return headers;
	}

	protected async makeRequest<T extends Record<string, unknown>>(
		path: string,
		data?: RequestData,
		method: Methods = 'GET',
	): Promise<ConnectionResponse<T> | null> {
		const url = this.makeUrl(path, data?.qs);

		const options: RequestInit = {
			method,
			body: data?.body ? JSON.stringify(data.body) : null,
		};

		if (data?.body) {
			options.headers = this.makeHeaders('application/json');
		} else if (data?.qs) {
			options.headers = this.makeHeaders('application/x-www-form-urlencoded');
		}

		let response;

		try {
			response = await fetch(url, options);
		} catch (e) {
			console.debug(e);
			return null;
		}

		return {
			response,
			data: await response.json(),
		};
	}
}
