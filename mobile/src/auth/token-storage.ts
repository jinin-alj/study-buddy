import * as SecureStore from 'expo-secure-store';

// Only the refresh token is stored; the access token lives in memory
const REFRESH_TOKEN_KEY = 'study_buddy.refresh_token';

/** Read the saved refresh token from the device keychain, or null if none or unreadable. */
export async function loadRefreshToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.warn('Could not read the saved session', error);
    return null;
  }
}

/** Save the refresh token in the device keychain. */
export async function saveRefreshToken(refreshToken: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
  } catch (error) {
    // Signing in still works; the user just has to sign in again next time
    console.warn('Could not save the session', error);
  }
}

/** Remove the saved refresh token, for sign-out. */
export async function clearRefreshToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.warn('Could not clear the saved session', error);
  }
}
