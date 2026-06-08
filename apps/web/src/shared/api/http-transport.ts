import { ApiError } from './errors';
import type { TokenStore } from './token-store';

export interface HttpTransportOptions {
  baseUrl: string;
  tokenStore: TokenStore;
  onUnauthorized?: () => Promise<boolean>;
}

export class HttpTransport {
  constructor(private readonly options: HttpTransportOptions) {}

  private authHeaders(auth: boolean): Headers {
    const headers = new Headers();
    if (auth) {
      const token = this.options.tokenStore.getAccessToken();
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    }
    return headers;
  }

  async request<T>(
    path: string,
    init: RequestInit = {},
    auth = true,
  ): Promise<T> {
    const headers = this.authHeaders(auth);
    for (const [key, value] of new Headers(init.headers)) {
      headers.set(key, value);
    }
    if (!headers.has('Content-Type') && init.body) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(`${this.options.baseUrl}${path}`, {
      ...init,
      headers,
    });

    if (response.status === 401 && auth && this.options.onUnauthorized) {
      const refreshed = await this.options.onUnauthorized();
      if (refreshed) {
        return this.request<T>(path, init, auth);
      }
    }

    if (!response.ok) {
      throw await ApiError.fromResponse(response);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }

  async requestBlob(path: string, auth = true): Promise<Blob> {
    const response = await fetch(`${this.options.baseUrl}${path}`, {
      headers: this.authHeaders(auth),
    });

    if (response.status === 401 && auth && this.options.onUnauthorized) {
      const refreshed = await this.options.onUnauthorized();
      if (refreshed) {
        return this.requestBlob(path, auth);
      }
    }

    if (!response.ok) {
      throw await ApiError.fromResponse(response);
    }

    return response.blob();
  }

  async requestText(path: string, auth = true): Promise<string> {
    const response = await fetch(`${this.options.baseUrl}${path}`, {
      headers: this.authHeaders(auth),
    });

    if (response.status === 401 && auth && this.options.onUnauthorized) {
      const refreshed = await this.options.onUnauthorized();
      if (refreshed) {
        return this.requestText(path, auth);
      }
    }

    if (!response.ok) {
      throw await ApiError.fromResponse(response);
    }

    return response.text();
  }
}
