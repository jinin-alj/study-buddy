import {
  normalizeUsername,
  validateDisplayName,
  validatePassword,
  validateUsername,
} from '@/auth/validation';

describe('normalizeUsername', () => {
  it('trims and lowercases like the backend', () => {
    expect(normalizeUsername('  Ana_G ')).toBe('ana_g');
  });
});

describe('validateUsername', () => {
  it('accepts letters, numbers, dots and underscores', () => {
    expect(validateUsername('ana.g_2')).toBeNull();
  });

  it('accepts mixed case because it is lowercased first', () => {
    expect(validateUsername('Ana_G')).toBeNull();
  });

  it('rejects names that are too short or too long', () => {
    expect(validateUsername('ab')).not.toBeNull();
    expect(validateUsername('a'.repeat(31))).not.toBeNull();
  });

  it('rejects spaces and symbols', () => {
    expect(validateUsername('has space')).not.toBeNull();
    expect(validateUsername('<script>')).not.toBeNull();
  });
});

describe('validatePassword', () => {
  it('needs 8 to 128 characters', () => {
    expect(validatePassword('short')).not.toBeNull();
    expect(validatePassword('long-enough')).toBeNull();
    expect(validatePassword('x'.repeat(129))).not.toBeNull();
  });
});

describe('validateDisplayName', () => {
  it('rejects a blank nickname', () => {
    expect(validateDisplayName('   ')).not.toBeNull();
  });

  it('accepts a short nickname', () => {
    expect(validateDisplayName('Ana')).toBeNull();
  });
});
