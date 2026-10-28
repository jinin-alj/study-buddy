/* eslint-disable @typescript-eslint/no-require-imports -- each test needs a fresh copy loaded with require */
type SpeechModuleFile = typeof import('@/speech/speech-module');

const fakeSpeechModule = { isRecognitionAvailable: () => true };

/** Load the speech module file fresh, as a phone or browser with or without the native code. */
function loadFresh(platform: string, nativeCodePresent: boolean, libraryLoads = true) {
  let moduleFile: SpeechModuleFile | null = null;
  jest.isolateModules(() => {
    jest.doMock('react-native', () => ({ Platform: { OS: platform } }));
    jest.doMock('expo', () => ({
      requireOptionalNativeModule: () => (nativeCodePresent ? {} : null),
    }));
    jest.doMock('expo-speech-recognition', () => {
      if (!libraryLoads) {
        throw new Error('Cannot find native module ExpoSpeechRecognition');
      }
      return { ExpoSpeechRecognitionModule: fakeSpeechModule };
    });
    moduleFile = require('@/speech/speech-module');
  });
  if (moduleFile === null) {
    throw new Error('speech module did not load');
  }
  return moduleFile as SpeechModuleFile;
}

afterEach(() => {
  jest.resetModules();
  jest.restoreAllMocks();
});

describe('loadSpeechModule', () => {
  it('skips the library entirely in Expo Go, where its native code is missing', () => {
    const importLibrary = jest.fn();
    jest.isolateModules(() => {
      jest.doMock('react-native', () => ({ Platform: { OS: 'ios' } }));
      jest.doMock('expo', () => ({ requireOptionalNativeModule: () => null }));
      jest.doMock('expo-speech-recognition', () => {
        importLibrary();
        throw new Error('Cannot find native module ExpoSpeechRecognition');
      });
      const moduleFile: SpeechModuleFile = require('@/speech/speech-module');
      expect(moduleFile.speechModule).toBeNull();
    });
    expect(importLibrary).not.toHaveBeenCalled();
  });

  it('uses the library in a development build that includes it', () => {
    expect(loadFresh('android', true).speechModule).toBe(fakeSpeechModule);
  });

  it("uses the browser's speech API on the web without checking for native code", () => {
    expect(loadFresh('web', false).speechModule).toBe(fakeSpeechModule);
  });

  it('falls back to no voice if the library still fails to load', () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    expect(loadFresh('ios', true, false).speechModule).toBeNull();
  });
});
