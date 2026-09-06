'use client';

export const getAccessToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
};

export const getRefreshToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('refreshToken');
};

export const setTokens = (accessToken: string, refreshToken: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
};

export const clearTokens = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
};

export const isAuthenticated = (): boolean => {
  return !!getAccessToken();
};
