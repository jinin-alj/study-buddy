import { requireOptionalNativeModule } from 'expo';
import type * as SpeechLibrary from 'expo-speech-recognition';
import { Platform } from 'react-native';

export type SpeechModule = typeof SpeechLibrary.ExpoSpeechRecognitionModule;

/** The speech recognition module, or null when this build doesn't include it (like Expo Go). */
export function loadSpeechModule(): SpeechModule | null {
  // The web version uses the browser's own speech API, so only phones need the native code
  const nativeCodeMissing =
    Platform.OS !== 'web' && requireOptionalNativeModule('ExpoSpeechRecognition') === null;
  if (nativeCodeMissing) {
    return null;
  }

  try {
    // A plain import would load the library even when its native code is missing and crash the app
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const speechLibrary: typeof SpeechLibrary = require('expo-speech-recognition');
    return speechLibrary.ExpoSpeechRecognitionModule;
  } catch (error) {
    console.warn('Speech recognition could not be loaded', error);
    return null;
  }
}

// Checked once when the app starts; whether the native code exists can't change while it runs
export const speechModule = loadSpeechModule();
