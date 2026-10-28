import { apiClient } from '@/api/client';

/** Ping the backend so a sleeping free-tier server starts waking before the first real request. */
export function wakeBackend(): void {
  apiClient.request('GET', '/health', { authenticated: false }).catch((error: unknown) => {
    // Expected while offline or while the server boots; the real request reports any problem
    console.info('Backend wake-up ping did not answer yet', error);
  });
}
