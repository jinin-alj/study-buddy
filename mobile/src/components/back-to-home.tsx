import { router } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, minimumTouchSize } from '@/theme';

/** "‹ My classes" link back to the home screen. */
export function BackToHome() {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Back to my classes"
      onPress={() => router.replace('/')}
      style={styles.back}
    >
      <Text style={styles.label}>‹ My classes</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  back: {
    minHeight: minimumTouchSize,
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  label: {
    color: colors.primary,
    fontSize: 16,
  },
});
