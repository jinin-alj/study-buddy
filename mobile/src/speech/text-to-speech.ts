import * as Speech from 'expo-speech';

import type { SpeechLanguage } from '@/speech/languages';

/** Read text aloud, cutting off anything still being spoken. */
export function speak(text: string, language: SpeechLanguage): void {
  Speech.stop();
  Speech.speak(text, { language, rate: 1.0 });
}

/** Stop speaking, for example before the microphone starts so it doesn't hear Pip. */
export function stopSpeaking(): void {
  Speech.stop();
}
