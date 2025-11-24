import { Student, Assessment, Grade, AppState } from '../types';

const STORAGE_KEY = 'edutrack_data_v1';

const INITIAL_DATA: AppState = {
  students: [
    { id: 's1', nis: '1001', name: 'Budi Santoso', gradeLevel: '10A' },
    { id: 's2', nis: '1002', name: 'Siti Aminah', gradeLevel: '10A' },
    { id: 's3', nis: '1003', name: 'Rizky Pratama', gradeLevel: '10B' },
  ],
  assessments: [
    { id: 'a1', title: 'UH Matematika Bab 1', subject: 'Matematika', date: '2023-10-01', maxScore: 100, description: 'Aljabar Dasar' },
    { id: 'a2', title: 'Kuis Biologi Sel', subject: 'Biologi', date: '2023-10-05', maxScore: 100 },
  ],
  grades: [
    { id: 'g1', studentId: 's1', assessmentId: 'a1', score: 85, feedback: 'Bagus, pertahankan.' },
    { id: 'g2', studentId: 's2', assessmentId: 'a1', score: 92, feedback: 'Sangat memuaskan!' },
  ],
};

export const loadData = (): AppState => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    return JSON.parse(saved);
  }
  return INITIAL_DATA;
};

export const saveData = (data: AppState) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};