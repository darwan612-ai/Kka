export enum View {
  HOME = 'HOME',
  STUDENT_PORTAL = 'STUDENT_PORTAL',
  TEACHER_DASHBOARD = 'TEACHER_DASHBOARD',
  TEACHER_STUDENTS = 'TEACHER_STUDENTS',
  TEACHER_ASSESSMENTS = 'TEACHER_ASSESSMENTS',
  TEACHER_GRADING = 'TEACHER_GRADING',
}

export interface Student {
  id: string;
  nis: string;
  name: string;
  gradeLevel: string; // e.g., "10A"
  contact?: string;
}

export interface Assessment {
  id: string;
  title: string; // e.g., "Ulangan Harian 1"
  subject: string; // e.g., "Matematika"
  date: string;
  maxScore: number;
  description?: string;
}

export interface Grade {
  id: string;
  studentId: string;
  assessmentId: string;
  score: number;
  feedback?: string;
}

export interface AppState {
  students: Student[];
  assessments: Assessment[];
  grades: Grade[];
}