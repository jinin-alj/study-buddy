import { apiClient } from '@/api/client';
import type { Classroom, ClassroomDashboard, Unit } from '@/api/types';

/** The classes this teacher owns. */
export function listClassrooms(): Promise<Classroom[]> {
  return apiClient.request<Classroom[]>('GET', '/classrooms');
}

/** Create a class and get its join code. */
export function createClassroom(name: string, subject: string): Promise<Classroom> {
  return apiClient.request<Classroom>('POST', '/classrooms', { body: { name, subject } });
}

/** Add a unit with the material students are checked against. */
export function addUnit(classroomId: string, title: string, material: string): Promise<Unit> {
  return apiClient.request<Unit>('POST', `/classrooms/${encodeURIComponent(classroomId)}/units`, {
    body: { title, material },
  });
}

/** How each student and the whole class are doing. */
export function getClassroomDashboard(classroomId: string): Promise<ClassroomDashboard> {
  return apiClient.request<ClassroomDashboard>(
    'GET',
    `/classrooms/${encodeURIComponent(classroomId)}/dashboard`,
  );
}
