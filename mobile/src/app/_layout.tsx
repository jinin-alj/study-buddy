import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { wakeBackend } from '@/api/health';
import { AuthProvider, useAuth } from '@/auth/auth-context';

// Keep the splash up until we know whether a saved session exists, to avoid a sign-in flash
SplashScreen.preventAutoHideAsync();

// The free backend sleeps when idle; start waking it while the person is still typing
wakeBackend();

function RootNavigator() {
  const { status, user } = useAuth();
  const signedIn = status === 'signedIn';
  const isStudent = user?.role === 'student';
  const isTeacher = user?.role === 'teacher';

  useEffect(() => {
    if (status !== 'loading') {
      SplashScreen.hideAsync();
    }
  }, [status]);

  if (status === 'loading') {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={signedIn} redirectTo="/sign-in">
        <Stack.Screen name="index" />
        {/* The API enforces these roles too; the guards just keep people off screens they can't use */}
        <Stack.Protected guard={isStudent} redirectTo="/">
          <Stack.Screen name="session/[sessionId]" />
        </Stack.Protected>
        <Stack.Protected guard={isTeacher} redirectTo="/">
          <Stack.Screen name="classroom/[classroomId]" />
        </Stack.Protected>
      </Stack.Protected>
      <Stack.Protected guard={!signedIn} redirectTo="/">
        <Stack.Screen name="sign-in" />
        <Stack.Screen name="sign-up" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}
