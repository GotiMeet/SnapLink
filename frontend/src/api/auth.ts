/**
 * Auth endpoints. Thin typed wrappers over `request` — no class, no client
 * object, no interceptor chain. One function per endpoint.
 */

import { request, resetSessionState } from '@/lib/api';
import type { User } from '@/types/models';

export const getMe = () => request<{ user: User }>('/auth/me').then((data) => data.user);

export const login = (body: { email: string; password: string }) =>
  request<{ user: User }>('/auth/login', { method: 'POST', body }).then((d) => {
    // A fresh session can refresh again; clear the dead-session latch.
    resetSessionState();
    return d.user;
  });

export const loginWithGoogle = (idToken: string) =>
  request<{ user: User }>('/auth/google', { method: 'POST', body: { idToken } }).then(
    (d) => {
      resetSessionState();
      return d.user;
    }
  );

export const register = (body: { fullName: string; email: string; password: string }) =>
  request<Record<string, never>>('/auth/register', { method: 'POST', body });

export const verifyEmail = (token: string) =>
  request<Record<string, never>>('/auth/verify-email', {
    method: 'POST',
    body: { token },
  });

export const resendVerificationEmail = (email: string) =>
  request<Record<string, never>>('/auth/resend-verification-email', {
    method: 'POST',
    body: { email },
  });

export const forgotPassword = (email: string) =>
  request<Record<string, never>>('/auth/forgot-password', {
    method: 'POST',
    body: { email },
  });

export const resetPassword = (body: { token: string; password: string }) =>
  request<Record<string, never>>('/auth/reset-password', { method: 'POST', body });

export const logout = () =>
  request<Record<string, never>>('/auth/logout', { method: 'POST' });

export const updateProfile = (fullName: string) =>
  request<{ user: User }>('/auth/me', { method: 'PATCH', body: { fullName } }).then(
    (d) => d.user
  );

export const setPassword = (body: { password: string; confirmPassword: string }) =>
  request<{ user: User }>('/auth/set-password', { method: 'POST', body }).then(
    (d) => d.user
  );

export const changePassword = (body: {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}) => request<Record<string, never>>('/auth/change-password', { method: 'POST', body });
