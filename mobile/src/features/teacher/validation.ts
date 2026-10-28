// Mirrors backend/app/schemas/classrooms.py so errors show before sending
const CLASS_NAME_MAX_LENGTH = 80;
const SUBJECT_MAX_LENGTH = 60;
const UNIT_TITLE_MAX_LENGTH = 120;
export const MATERIAL_MIN_LENGTH = 50;
export const MATERIAL_MAX_LENGTH = 12000;

/** Error for a required short text field, or null if it's valid. */
function validateRequiredText(value: string, fieldName: string, maxLength: number): string | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return `Add a ${fieldName}.`;
  }
  if (trimmed.length > maxLength) {
    return `Use at most ${maxLength} characters.`;
  }
  return null;
}

/** Error for a class name, or null. */
export function validateClassName(name: string): string | null {
  return validateRequiredText(name, 'class name', CLASS_NAME_MAX_LENGTH);
}

/** Error for a subject, or null. */
export function validateSubject(subject: string): string | null {
  return validateRequiredText(subject, 'subject', SUBJECT_MAX_LENGTH);
}

/** Error for a unit title, or null. */
export function validateUnitTitle(title: string): string | null {
  return validateRequiredText(title, 'title', UNIT_TITLE_MAX_LENGTH);
}

/** Error for unit material, or null; too little gives the checker nothing to grade against. */
export function validateMaterial(material: string): string | null {
  const length = material.trim().length;
  if (length < MATERIAL_MIN_LENGTH) {
    return `Add at least ${MATERIAL_MIN_LENGTH} characters so the checker has enough to work with.`;
  }
  if (length > MATERIAL_MAX_LENGTH) {
    return `Use at most ${MATERIAL_MAX_LENGTH} characters. Split long topics into several units.`;
  }
  return null;
}
