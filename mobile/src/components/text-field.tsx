import { StyleSheet, Text, TextInput, View } from 'react-native';
import type { TextInputProps } from 'react-native';

import { colors, minimumTouchSize, spacing } from '@/theme';

type TextFieldProps = TextInputProps & {
  label: string;
  hint?: string;
  error?: string | null;
};

/** A labelled text input that announces its hint and error to screen readers. */
export function TextField({ label, hint, error, ...inputProps }: TextFieldProps) {
  const description = [hint, error].filter(Boolean).join('. ');

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        accessibilityHint={description === '' ? undefined : description}
        placeholderTextColor={colors.mutedText}
        style={[styles.input, error ? styles.inputWithError : null]}
        {...inputProps}
      />
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      {error ? (
        <Text accessibilityLiveRegion="polite" style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.medium,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  input: {
    minHeight: minimumTouchSize,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.background,
  },
  inputWithError: {
    borderColor: colors.error,
    borderWidth: 2,
  },
  hint: {
    marginTop: 4,
    fontSize: 14,
    color: colors.mutedText,
  },
  error: {
    marginTop: 4,
    fontSize: 14,
    color: colors.error,
  },
});
