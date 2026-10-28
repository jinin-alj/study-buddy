const DEFAULT_API_URL = 'http://localhost:8000';

/** Return the backend base URL without a trailing slash. */
export function getApiBaseUrl(
  configuredUrl: string | undefined = process.env.EXPO_PUBLIC_API_URL,
): string {
  const apiUrl =
    configuredUrl && configuredUrl.trim() !== '' ? configuredUrl.trim() : DEFAULT_API_URL;
  return apiUrl.replace(/\/+$/, '');
}
