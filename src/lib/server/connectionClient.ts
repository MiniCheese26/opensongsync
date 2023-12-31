import dayjs from "dayjs";

type RequestDataBase = {
  qs?: Record<string, string | number>;
};

type RequestDataFormData = {
  body?: never;
  formData: Record<string, string | number>;
  raw?: never;
} & RequestDataBase;

type RequestDataJson = {
  body: Record<string, unknown> | unknown[];
  formData?: never;
  raw?: never;
} & RequestDataBase;

type RequestDataRaw = {
  body?: never;
  formData?: never;
  raw?: string;
} & RequestDataBase;

export type RequestData = RequestDataFormData | RequestDataJson | RequestDataRaw;

export type Methods = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'OPTIONS';

export type ConnectionResponse<T> = {
  response: Response;
  data: T;
  text: string;
};

export class TrackItem {
  constructor(
    public name: string,
    public id: string | number,
    public album: string,
    public artists: string[],
    public href: string,
    public year?: string,
    public isrc?: string,
  ) {}

  toJson() {
    return {
      name: this.name,
      id: this.id,
      album: this.album,
      artists: this.artists,
      href: this.href,
      year: this.year,
      isrc: this.isrc,
    };
  }
}

export abstract class ConnectionClient {
  protected abstract readonly API_BASE: string;
  protected abstract readonly THROTTLE_TIME: number;
  protected lastRequest: Date | null = null;

  protected constructor(protected accessToken: string) {}

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

  protected makeBody(data?: RequestData) {
    let body = null;

    if (data?.body) {
      body = JSON.stringify(data.body);
    } else if (data?.formData) {
      const formData = new FormData();

      Object.entries(data.formData).forEach(([k, v]) => {
        formData.append(k, String(v));
      });

      body = formData;
    } else if (data?.raw) {
      body = data.raw;
    }

    return body;
  }

  protected async throttleRequest() {
    if (this.lastRequest) {
      const now = dayjs();
      const lastRequest = dayjs(this.lastRequest);
      const nextRequest = lastRequest.add(this.THROTTLE_TIME, 'milliseconds');

      if (now.isBefore(nextRequest)) {
        const timeLeft = nextRequest.diff(now, 'milliseconds');

        await new Promise((resolve) => {
          setTimeout(resolve, timeLeft)
        });
      }
    }

    this.lastRequest = new Date();

    return;
  }

  protected async makeRequest<T extends Record<string, unknown>>(
    path: string,
    data?: RequestData,
    method: Methods = 'GET',
    headers: Record<string, string> = {},
  ): Promise<ConnectionResponse<T | null> | null> {
    await this.throttleRequest();

    const url = this.makeUrl(path, data?.qs);
    const body = this.makeBody(data);

    const options: RequestInit = {
      method,
      body,
    };

    if (data?.body) {
      options.headers = this.makeHeaders('application/json');
    } else if (data?.qs || data?.formData) {
      options.headers = this.makeHeaders('application/x-www-form-urlencoded');
    } else {
      options.headers = this.makeHeaders();
    }

    if (headers) {
      options.headers = {
        ...options.headers,
        ...headers,
      };
    }

    let response;

    try {
      response = await fetch(url, options);
    } catch (e) {
      console.debug(e);
      return null;
    }

    let responseData;

    const text = await response.text();

    try {
      responseData = JSON.parse(text);
    } catch (e) {
      responseData = null;
    }

    return {
      response,
      data: responseData,
      text,
    };
  }
}
