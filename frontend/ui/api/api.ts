const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || '/api').replace(/\/+$/, '');

let globalApiHeaders = new Headers();

export const setGlobalApiHeaders = (headers: HeadersInit): void => {
  globalApiHeaders = new Headers(headers);
};

export const addAuthorization = (accessToken: string): void => {
  const token = accessToken.trim();
  if (!token) {
    throw new TypeError('Authorization access token cannot be empty');
  }

  globalApiHeaders.set('Authorization', `Bearer ${token}`);
};

export const clearAuthorization = (): void => {
  globalApiHeaders.delete('Authorization');
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly statusText: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const requestJson = async (path: string, init?: RequestInit): Promise<unknown> => {
  const headers = new Headers(globalApiHeaders);
  new Headers(init?.headers).forEach((value, name) => headers.set(name, value));

  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });

  if (!response.ok) {
    // Backend napake opiše v polju error, to besedilo je namenjeno uporabniku
    const body = (await response.json().catch(() => null)) as { error?: unknown } | null;
    throw new ApiError(
      typeof body?.error === 'string' ? body.error : `API request failed (${response.status} ${response.statusText})`,
      response.status,
      response.statusText,
    );
  }

  return response.json();
};
