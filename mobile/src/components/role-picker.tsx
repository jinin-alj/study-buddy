import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { UserRole } from '@/api/types';
import { colors, minimumTouchSize, spacing } from '@/theme';

const ROLE_OPTIONS: { role: UserRole; label: string }[] = [
  { role: 'student', label: "I'm a student" },
  { role: 'teacher', label: "I'm a teacher" },
];

type RolePickerProps = {
  value: UserRole;
  onChange: (role: UserRole) => void;
};

/** Two-option choice between student and teacher, exposed to screen readers as radio buttons. */
export function RolePicker({ value, onChange }: RolePickerProps) {
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel="Account type" style={styles.row}>
      {ROLE_OPTIONS.map((option) => {
        const selected = option.role === value;
        return (
          <Pressable
            key={option.role}
            accessibilityRole="radio"
            accessibilityLabel={option.label}
            accessibilityState={{ checked: selected }}
            onPress={() => onChange(option.role)}
            style={[styles.option, selected ? styles.selected : null]}
          >
            <Text style={[styles.label, selected ? styles.selectedLabel : null]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.small,
    marginBottom: spacing.medium,
  },
  option: {
    flex: 1,
    minHeight: minimumTouchSize,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: spacing.small,
  },
  selected: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: colors.surface,
  },
  label: {
    fontSize: 16,
    color: colors.text,
  },
  selectedLabel: {
    fontWeight: '700',
    color: colors.primary,
  },
});
