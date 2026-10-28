import { StyleSheet, Text } from 'react-native';

import { useAuth } from '@/auth/auth-context';
import { Button } from '@/components/button';
import { Screen } from '@/components/screen';
import { StudentHome } from '@/features/student/student-home';
import { colors, spacing } from '@/theme';

export default function HomeScreen() {
  const { user, signOut } = useAuth();
  if (user === null) {
    return null;
  }
  if (user.role === 'student') {
    return <StudentHome user={user} onSignOut={signOut} />;
  }

  // TODO: replace with the teacher dashboard screens
  return (
    <Screen>
      <Text accessibilityRole="header" style={styles.title}>
        Hi, {user.display_name}
      </Text>
      <Text style={styles.role}>Teacher account</Text>
      <Text style={styles.message}>
        Create a class, add a unit and share the join code with your students.
      </Text>
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
