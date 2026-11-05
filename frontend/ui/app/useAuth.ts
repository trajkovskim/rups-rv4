import { useEffect, useState } from 'react';
import { addAuthorization, ApiError, clearAuthorization } from '@/api/api';
import { getCurrentUser, login, register } from '@/api/apiAuthService';
import type { AuthResponse, AuthUser, LoginData, RegistrationData } from '@/api/types';

const TOKEN_KEY = 'meridiani.token';

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    clearAuthorization();
    setUser(null);
  };

  const signIn = ({ token, user: signedInUser }: AuthResponse) => {
    localStorage.setItem(TOKEN_KEY, token);
    addAuthorization(token);
    setUser(signedInUser);
  };

  // Ob ponovnem obisku preverimo, ali shranjeni žeton še velja
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;

    addAuthorization(token);
    void getCurrentUser()
      .then(setUser)
      .catch((error: unknown) => {
        // Če je strežnik samo nedosegljiv, žeton obdržimo za naslednji obisk
        if (error instanceof ApiError && error.status === 401) {
          localStorage.removeItem(TOKEN_KEY);
          clearAuthorization();
        }
      });
  }, []);

  return {
    user,
    logout,
    login: async (data: LoginData) => signIn(await login(data)),
    register: async (data: RegistrationData) => signIn(await register(data)),
  };
}
