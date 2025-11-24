import { GoogleGenAI } from "@google/genai";
import { Grade, Assessment, Student } from '../types';

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API Key not found");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generateStudentFeedback = async (
  studentName: string,
  assessmentTitle: string,
  score: number,
  maxScore: number
): Promise<string> => {
  const ai = getAiClient();
  if (!ai) return "Error: API Key missing.";

  try {
    const prompt = `
      Bertindaklah sebagai guru yang bijak dan suportif di Indonesia.
      Berikan komentar umpan balik singkat (maksimal 2 kalimat) untuk siswa bernama ${studentName}.
      
      Konteks:
      - Ujian: ${assessmentTitle}
      - Nilai: ${score} dari ${maxScore}
      
      Jika nilai rendah (<60%), berikan semangat dan saran belajar.
      Jika nilai sedang (60-80), berikan apresiasi dan dorongan untuk lebih teliti.
      Jika nilai tinggi (>80%), berikan pujian.
      Gunakan Bahasa Indonesia yang formal namun hangat.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Tidak dapat menghasilkan feedback.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Maaf, terjadi kesalahan saat membuat feedback otomatis.";
  }
};

export const analyzeClassPerformance = async (
  assessment: Assessment,
  grades: Grade[],
  students: Student[]
): Promise<string> => {
  const ai = getAiClient();
  if (!ai) return "Error: API Key missing.";

  try {
    // Construct data summary
    const summary = grades
      .filter(g => g.assessmentId === assessment.id)
      .map(g => {
        const s = students.find(stu => stu.id === g.studentId);
        return `${s?.name || 'Unknown'}: ${g.score}`;
      })
      .join('\n');

    const prompt = `
      Analisis performa kelas untuk ujian: "${assessment.title}" (Mata Pelajaran: ${assessment.subject}).
      Nilai Maksimal: ${assessment.maxScore}.
      
      Data Nilai Siswa:
      ${summary}
      
      Berikan ringkasan analisis dalam format bullet points markdown:
      1. Rata-rata kelas (perkiraan).
      2. Siswa dengan performa tertinggi.
      3. Area yang mungkin perlu dievaluasi ulang oleh guru (jika banyak nilai rendah).
      4. Saran strategi pengajaran selanjutnya.
      Gunakan Bahasa Indonesia.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Tidak dapat menganalisis data.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Gagal melakukan analisis AI.";
  }
};