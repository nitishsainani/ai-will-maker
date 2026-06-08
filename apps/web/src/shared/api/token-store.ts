export interface TokenStore {
  getAccessToken(): string | null;
  getRefreshToken(): string | null;
  setSession(accessToken: string, refreshToken: string): void;
  clear(): void;
}

export class SessionStorageTokenStore implements TokenStore {
  private readonly accessKey = 'will_maker_access_token';
  private readonly refreshKey = 'will_maker_refresh_token';

  getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem(this.accessKey);
  }

  getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem(this.refreshKey);
  }

  setSession(accessToken: string, refreshToken: string): void {
    sessionStorage.setItem(this.accessKey, accessToken);
    sessionStorage.setItem(this.refreshKey, refreshToken);
  }

  clear(): void {
    sessionStorage.removeItem(this.accessKey);
    sessionStorage.removeItem(this.refreshKey);
  }
}
