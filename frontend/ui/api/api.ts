const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || '/api').replace(/\/+$/, '');

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
  const response = await fetch(`${API_BASE_URL}${path}`, init);

  if (!response.ok) {
    throw new ApiError(
      `API request failed (${response.status} ${response.statusText})`,
      response.status,
      response.statusText,
    );
  }

  return response.json();
};
