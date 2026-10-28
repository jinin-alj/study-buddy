// Shapes returned by the backend; keep in sync with backend/app/schemas

export type UserRole = 'student' | 'teacher';

export type User = {
  id: string;
  username: string;
  display_name: string;
  role: UserRole;
};

export type AuthResponse = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
};

export type RegisterForm = {
  username: string;
  display_name: string;
  password: string;
  role: UserRole;
};
