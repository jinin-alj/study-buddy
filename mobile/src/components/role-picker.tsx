import type { UserRole } from '@/api/types';
import { ChoiceGroup } from '@/components/choice-group';

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'student', label: "I'm a student" },
  { value: 'teacher', label: "I'm a teacher" },
];

type RolePickerProps = {
  value: UserRole;
  onChange: (role: UserRole) => void;
};

/** Choice between a student and a teacher account. */
export function RolePicker({ value, onChange }: RolePickerProps) {
  return (
    <ChoiceGroup label="Account type" options={ROLE_OPTIONS} value={value} onChange={onChange} />
  );
}
