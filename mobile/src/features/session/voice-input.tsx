import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { ApiError } from '@/api/client';
import { Button } from '@/components/button';
import type { SpeechLanguage } from '@/speech/languages';
import { useSpeechToText } from '@/speech/use-speech-to-text';
import { colors, minimumTouchSize, spacing } from '@/theme';

// Matches TURN_MAX_CHARACTERS in backend/app/schemas/study_sessions.py
const MAX_CHARACTERS = 2000;
const MICROPHONE_SIZE = 96;

// Expo Go and browsers like Firefox can't recognise speech; tell students what they can do instead
const NO_VOICE_NOTE =
  Platform.OS === 'web'
    ? "Voice isn't available in this browser. Use Chrome or Safari to talk, or type below."
    : 'Voice needs the full Study Buddy app. For now, type below.';

type VoiceInputProps = {
  language: SpeechLanguage;
  prompt: string;
  typingPrompt: string;
  submitLabel: string;
  onSubmit: (text: string) => Promise<void>;
};

/** Speak (or type) an answer, review and fix the transcript, then send it. */
export function VoiceInput({
  language,
  prompt,
  typingPrompt,
  submitLabel,
  onSubmit,
}: VoiceInputProps) {
  const speech = useSpeechToText();
  const [typing, setTyping] = useState(!speech.isAvailable);
  const [editedText, setEditedText] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  // Once the student edits the transcript, their version wins over what was heard
  const text = editedText ?? speech.transcript;
  const hasText = text.trim() !== '';

  function handleMicrophonePress() {
    if (speech.isListening) {
      speech.stopListening();
    } else {
      setEditedText(null);
      speech.clearTranscript();
      speech.startListening(language);
    }
  }

  function handleStartOver() {
    setEditedText(null);
    speech.clearTranscript();
  }

  async function handleSend() {
    if (!hasText || sending) {
      return;
    }
    if (speech.isListening) {
      speech.stopListening();
    }
    setSending(true);
    setSendError(null);
    try {
      await onSubmit(text.trim().slice(0, MAX_CHARACTERS));
      setEditedText(null);
      speech.clearTranscript();
    } catch (error) {
      setSendError(error instanceof ApiError ? error.message : 'That did not send. Try again.');
    } finally {
      setSending(false);
    }
  }

  const showTranscriptBox = typing || hasText || speech.isListening;

  return (
    <View style={styles.container}>
      {!speech.isAvailable ? <Text style={styles.note}>{NO_VOICE_NOTE}</Text> : null}

      {!typing ? (
        <View style={styles.microphoneArea}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={speech.isListening ? 'Stop talking' : 'Tap to talk'}
            accessibilityState={{ busy: speech.isListening }}
            onPress={handleMicrophonePress}
            disabled={sending}
            style={[styles.microphone, speech.isListening ? styles.microphoneListening : null]}
          >
            <View style={styles.microphoneIcon} />
          </Pressable>
          <Text style={styles.microphoneLabel}>
            {speech.isListening ? 'Listening… tap to stop' : prompt}
          </Text>
        </View>
      ) : null}

      {speech.errorMessage ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {speech.errorMessage}
        </Text>
      ) : null}

      {showTranscriptBox ? (
        <TextInput
          accessibilityLabel={typing ? typingPrompt : 'What Pip heard. You can fix mistakes here.'}
          placeholder={typing ? typingPrompt : ''}
          placeholderTextColor={colors.mutedText}
          value={text}
          onChangeText={setEditedText}
          editable={!speech.isListening && !sending}
          multiline
          maxLength={MAX_CHARACTERS}
          style={styles.transcript}
        />
      ) : null}

      {sendError ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {sendError}
        </Text>
      ) : null}

      {hasText && !speech.isListening ? (
        <>
          <Button label={submitLabel} onPress={handleSend} loading={sending} />
          {!typing ? (
            <Button label="Start over" variant="secondary" onPress={handleStartOver} />
          ) : null}
        </>
      ) : null}

      {speech.isAvailable ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={typing ? 'Talk instead' : 'Type instead'}
          onPress={() => setTyping(!typing)}
          style={styles.switchMode}
        >
          <Text style={styles.switchModeLabel}>{typing ? 'Talk instead' : 'Type instead'}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.medium,
  },
  note: {
    fontSize: 15,
    color: colors.mutedText,
    marginBottom: spacing.small,
  },
  microphoneArea: {
    alignItems: 'center',
    marginVertical: spacing.medium,
  },
  microphone: {
    width: MICROPHONE_SIZE,
    height: MICROPHONE_SIZE,
    borderRadius: MICROPHONE_SIZE / 2,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  microphoneListening: {
    backgroundColor: colors.error,
  },
  microphoneIcon: {
    width: 22,
    height: 36,
    borderRadius: 11,
    backgroundColor: colors.onPrimary,
  },
  microphoneLabel: {
    fontSize: 16,
    color: colors.text,
    marginTop: spacing.small,
    textAlign: 'center',
  },
  transcript: {
    minHeight: 96,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 17,
    color: colors.text,
    textAlignVertical: 'top',
  },
  error: {
    color: colors.error,
    fontSize: 15,
    marginTop: spacing.small,
  },
  switchMode: {
    minHeight: minimumTouchSize,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.small,
  },
  switchModeLabel: {
    color: colors.primary,
    fontSize: 16,
    textDecorationLine: 'underline',
  },
});
