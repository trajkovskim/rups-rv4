import { requestJson } from './api';
import type { AuthResponse, AuthUser, LoginData, RegistrationData } from './types';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isUser = (value: unknown): value is AuthUser =>
  isRecord(value) &&
  typeof value.id === 'string' &&
  typeof value.email === 'string' &&
  typeof value.username === 'string' &&
  typeof value.createdAt === 'string';

const toAuthResponse = (data: unknown): AuthResponse => {
  if (!isRecord(data) || typeof data.token !== 'string' || !isUser(data.user)) {
    throw new Error('Invalid auth response from API');
  }
  return { token: data.token, user: data.user };
};

const post = (path: string, body: unknown) =>
  requestJson(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

export const login = async (data: LoginData) => toAuthResponse(await post('/auth/login', data));

export const register = async (data: RegistrationData) =>
  toAuthResponse(await post('/auth/register', data));

export const getCurrentUser = async (): Promise<AuthUser> => {
  const data = await requestJson('/auth/me');
  if (!isRecord(data) || !isUser(data.user)) {
    throw new Error('Invalid auth response from API');
  }
  return data.user;
};
