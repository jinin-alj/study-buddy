// SecureStore has no web version. sessionStorage survives reloads but is cleared when the
// tab closes, which limits how long a stolen token is useful compared with localStorage.
const REFRESH_TOKEN_KEY = 'study_buddy.refresh_token';

/** Read the saved refresh token for this browser tab, or null. */
export async function loadRefreshToken(): Promise<string | null> {
  try {
    return window.sessionStorage.getItem(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.warn('Could not read the saved session', error);
    return null;
  }
}

/** Save the refresh token for this browser tab. */
export async function saveRefreshToken(refreshToken: string): Promise<void> {
  try {
    window.sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  } catch (error) {
    console.warn('Could not save the session', error);
  }
}

/** Remove the saved refresh token, for sign-out. */
export async function clearRefreshToken(): Promise<void> {
  try {
    window.sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.warn('Could not clear the saved session', error);
  }
}
