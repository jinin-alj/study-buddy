import { getApiBaseUrl } from '@/config/api';

describe('getApiBaseUrl', () => {
  it('falls back to localhost when nothing is configured', () => {
    expect(getApiBaseUrl(undefined)).toBe('http://localhost:8000');
  });

  it('falls back to localhost when the value is blank', () => {
    expect(getApiBaseUrl('   ')).toBe('http://localhost:8000');
  });

  it('strips trailing slashes from a configured URL', () => {
    expect(getApiBaseUrl('https://api.example.com//')).toBe('https://api.example.com');
  });
});
