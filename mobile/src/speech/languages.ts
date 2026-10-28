export type SpeechLanguage = 'en-US' | 'es-ES';

export const SPEECH_LANGUAGES: { value: SpeechLanguage; label: string }[] = [
  { value: 'en-US', label: 'English' },
  { value: 'es-ES', label: 'Español' },
];

/** Spanish if the device is set to Spanish, otherwise English. */
export function getDefaultSpeechLanguage(
  deviceLocale: string = Intl.DateTimeFormat().resolvedOptions().locale,
): SpeechLanguage {
  if (deviceLocale.toLowerCase().startsWith('es')) {
    return 'es-ES';
  }
  return 'en-US';
}
