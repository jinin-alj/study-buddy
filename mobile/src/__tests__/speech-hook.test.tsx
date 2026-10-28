import { act, renderHook } from '@testing-library/react-native';

import { isSpeechRecognitionAvailable, useSpeechToText } from '@/speech/use-speech-to-text';

// Behave like Expo Go: the speech library's native code isn't in this build
jest.mock('@/speech/speech-module', () => ({ speechModule: null }));
jest.mock('expo-speech', () => ({ speak: jest.fn(), stop: jest.fn() }));

describe('useSpeechToText without speech recognition', () => {
  it('reports voice as unavailable so the app shows typing', async () => {
    const { result } = await renderHook(() => useSpeechToText());

    expect(isSpeechRecognitionAvailable(null)).toBe(false);
    expect(result.current.isAvailable).toBe(false);
  });

  it('explains instead of crashing if listening is attempted anyway', async () => {
    const { result } = await renderHook(() => useSpeechToText());

    await act(async () => {
      await result.current.startListening('en-US');
    });
    result.current.stopListening();

    expect(result.current.errorMessage).toContain('type instead');
    expect(result.current.isListening).toBe(false);
  });
});
