import { useAuth } from '@/auth/auth-context';
import { StudentHome } from '@/features/student/student-home';
import { TeacherHome } from '@/features/teacher/teacher-home';

export default function HomeScreen() {
  const { user, signOut } = useAuth();
  if (user === null) {
    return null;
  }
  if (user.role === 'teacher') {
    return <TeacherHome user={user} onSignOut={signOut} />;
  }
  return <StudentHome user={user} onSignOut={signOut} />;
}
