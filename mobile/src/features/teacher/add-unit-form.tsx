import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ApiError } from '@/api/client';
import { addUnit } from '@/api/teaching';
import { Button } from '@/components/button';
import { TextField } from '@/components/text-field';
import {
  MATERIAL_MAX_LENGTH,
  validateMaterial,
  validateUnitTitle,
} from '@/features/teacher/validation';
import { colors, spacing } from '@/theme';

type AddUnitFormProps = {
  classroomId: string;
  onAdded: () => void;
  onCancel: () => void;
};

/** Add a topic and the material students will be checked against. */
export function AddUnitForm({ classroomId, onAdded, onCancel }: AddUnitFormProps) {
  const [title, setTitle] = useState('');
  const [material, setMaterial] = useState('');
  const [titleError, setTitleError] = useState<string | null>(null);
  const [materialError, setMaterialError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const nextTitleError = validateUnitTitle(title);
    const nextMaterialError = validateMaterial(material);
    setTitleError(nextTitleError);
    setMaterialError(nextMaterialError);
    setFormError(null);
    if (nextTitleError || nextMaterialError) {
      return;
    }

    setSaving(true);
    try {
      await addUnit(classroomId, title.trim(), material.trim());
      onAdded();
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : 'Could not add the unit.');
      setSaving(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text accessibilityRole="header" style={styles.heading}>
        Add a unit
      </Text>
      <TextField label="Unit title" error={titleError} value={title} onChangeText={setTitle} />
      <TextField
        label="Your material"
        hint={`Paste your notes, slides or textbook pages. Students never see this; Pip and the checker use it. ${material.trim().length} of ${MATERIAL_MAX_LENGTH} characters.`}
        error={materialError}
        value={material}
        onChangeText={setMaterial}
        multiline
        maxLength={MATERIAL_MAX_LENGTH + 500}
        style={styles.material}
      />
      {formError ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {formError}
        </Text>
      ) : null}
      <Button label="Save unit" onPress={handleSave} loading={saving} />
      <Button label="Cancel" variant="secondary" onPress={onCancel} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.medium,
    padding: spacing.medium,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heading: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.small,
  },
  material: {
    minHeight: 180,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  error: {
    color: colors.error,
    fontSize: 15,
    marginBottom: spacing.small,
  },
});
