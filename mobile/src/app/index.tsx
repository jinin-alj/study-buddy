import { StyleSheet, Text } from 'react-native';

import { useAuth } from '@/auth/auth-context';
import { Button } from '@/components/button';
import { Screen } from '@/components/screen';
import { colors, spacing } from '@/theme';

// TODO: replace these placeholders with the study session and teacher dashboard screens
const HOME_MESSAGE = {
  student: 'Join a class and explain your first unit to Pip.',
  teacher: 'Create a class, add a unit and share the join code with your students.',
};

export default function HomeScreen() {
  const { user, signOut } = useAuth();
  if (user === null) {
    return null;
  }

  return (
    <Screen>
      <Text accessibilityRole="header" style={styles.title}>
        Hi, {user.display_name}
      </Text>
      <Text style={styles.role}>{user.role === 'teacher' ? 'Teacher' : 'Student'} account</Text>
      <Text style={styles.message}>{HOME_MESSAGE[user.role]}</Text>
      <Button label="Sign out" variant="secondary" onPress={signOut} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  role: {
    fontSize: 16,
    color: colors.mutedText,
    marginTop: 4,
  },
  message: {
    fontSize: 18,
    color: colors.text,
    marginVertical: spacing.large,
  },
});
