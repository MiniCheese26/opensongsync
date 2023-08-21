type RequestDataBase = {
  qs?: Record<string, string | number>;
};

type RequestDataFormData = {
  body?: never;
  formData?: Record<string, string>;
} & RequestDataBase;

type RequestDataJson = {
  body: Record<string, unknown> | unknown[];
  formData?: never;
} & RequestDataBase;

export type RequestData = RequestDataFormData | RequestDataJson;

export type Methods = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'OPTIONS';

export type ConnectionResponse<T> = {
  response: Response;
  data: T;
  text: string;
};

export type Track = {
  id: string | number;
  name: string;
  album: string;
  artists: string[];
  href: string;
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
}

export abstract class ConnectionClient {
  protected abstract readonly API_BASE: string;

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
        formData.append(k, v);
      });

      body = formData;
    }

    return body;
  }

  protected async makeRequest<T extends Record<string, unknown>>(
    path: string,
    data?: RequestData,
    method: Methods = 'GET',
  ): Promise<ConnectionResponse<T | null> | null> {
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
