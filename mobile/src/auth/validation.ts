// Mirrors the backend rules in backend/app/schemas/auth.py so errors show before sending
const USERNAME_PATTERN = /^[a-z0-9_.]+$/;
const USERNAME_MIN_LENGTH = 3;
const USERNAME_MAX_LENGTH = 30;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 128;
const DISPLAY_NAME_MAX_LENGTH = 40;

/** Trim and lowercase, the same way the backend stores usernames. */
export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

/** Return an error message for the username, or null if it's valid. */
export function validateUsername(username: string): string | null {
  const normalized = normalizeUsername(username);
  if (normalized.length < USERNAME_MIN_LENGTH) {
    return `Use at least ${USERNAME_MIN_LENGTH} characters.`;
  }
  if (normalized.length > USERNAME_MAX_LENGTH) {
    return `Use at most ${USERNAME_MAX_LENGTH} characters.`;
  }
  if (!USERNAME_PATTERN.test(normalized)) {
    return 'Use only letters, numbers, dots and underscores.';
  }
  return null;
}

/** Return an error message for the password, or null if it's valid. */
export function validatePassword(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Use at least ${PASSWORD_MIN_LENGTH} characters.`;
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return `Use at most ${PASSWORD_MAX_LENGTH} characters.`;
  }
  return null;
}

/** Return an error message for the nickname, or null if it's valid. */
export function validateDisplayName(displayName: string): string | null {
  const trimmed = displayName.trim();
  if (trimmed.length === 0) {
    return 'Add a nickname. It does not have to be your real name.';
  }
  if (trimmed.length > DISPLAY_NAME_MAX_LENGTH) {
    return `Use at most ${DISPLAY_NAME_MAX_LENGTH} characters.`;
  }
  return null;
}
