import React, { useState, useEffect } from 'react';
import { View, AppState, Student, Assessment, Grade } from './types';
import { loadData, saveData, generateId } from './services/storageService';
import { generateStudentFeedback, analyzeClassPerformance } from './services/geminiService';

// Components
import { Button } from './components/Button';
import { Card } from './components/Card';
import { Input } from './components/Input';
import { Modal } from './components/Modal';

// Icons
const Icons = {
  Home: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  User: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  Chart: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" /></svg>,
  Book: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
  Sparkles: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>,
  Edit: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
  Trash: () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
};

const App: React.FC = () => {
  const [view, setView] = useState<View>(View.HOME);
  const [data, setData] = useState<AppState>({ students: [], assessments: [], grades: [] });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Load initial data
  useEffect(() => {
    setData(loadData());
  }, []);

  // Save on change
  useEffect(() => {
    if (data.students.length > 0) { // Simple check to avoid overwriting with empty init
      saveData(data);
    }
  }, [data]);

  // --- Actions ---

  const addStudent = (student: Omit<Student, 'id'>) => {
    const newStudent = { ...student, id: generateId() };
    setData(prev => ({ ...prev, students: [...prev.students, newStudent] }));
  };

  const deleteStudent = (id: string) => {
    if(window.confirm('Yakin ingin menghapus siswa ini?')) {
        setData(prev => ({ 
            ...prev, 
            students: prev.students.filter(s => s.id !== id),
            grades: prev.grades.filter(g => g.studentId !== id)
        }));
    }
  };

  const addAssessment = (assessment: Omit<Assessment, 'id'>) => {
    const newAssessment = { ...assessment, id: generateId() };
    setData(prev => ({ ...prev, assessments: [...prev.assessments, newAssessment] }));
  };

  const deleteAssessment = (id: string) => {
     if(window.confirm('Yakin ingin menghapus penilaian ini?')) {
        setData(prev => ({
            ...prev,
            assessments: prev.assessments.filter(a => a.id !== id),
            grades: prev.grades.filter(g => g.assessmentId !== id)
        }));
     }
  };

  const updateGrade = (gradeData: Omit<Grade, 'id'> & { id?: string }) => {
    setData(prev => {
      const existing = prev.grades.find(g => g.studentId === gradeData.studentId && g.assessmentId === gradeData.assessmentId);
      if (existing) {
        return {
          ...prev,
          grades: prev.grades.map(g => g.id === existing.id ? { ...g, ...gradeData, id: existing.id } : g)
        };
      } else {
        return {
          ...prev,
          grades: [...prev.grades, { ...gradeData, id: generateId() }]
        };
      }
    });
  };

  // --- Sub-Components (Views) ---

  const SidebarItem = ({ viewTarget, icon, label }: { viewTarget: View, icon: any, label: string }) => (
    <button
      onClick={() => { setView(viewTarget); setIsMobileMenuOpen(false); }}
      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
        view === viewTarget ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600 hover:bg-slate-50'
      }`}
    >
      {icon()}
      <span>{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b p-4 flex justify-between items-center sticky top-0 z-20">
        <h1 className="font-bold text-xl text-blue-600 flex items-center gap-2">
            <Icons.Book /> EduTrack
        </h1>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-slate-600">
           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`fixed inset-y-0 left-0 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition duration-200 ease-in-out z-30 w-64 bg-white border-r border-slate-200 flex flex-col`}>
        <div className="p-6 border-b border-slate-100 hidden md:flex items-center gap-2">
           <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
             <Icons.Book />
           </div>
           <h1 className="font-bold text-xl text-slate-800">EduTrack</h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <div className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Umum</div>
          <SidebarItem viewTarget={View.HOME} icon={Icons.Home} label="Beranda Sekolah" />
          <SidebarItem viewTarget={View.STUDENT_PORTAL} icon={Icons.User} label="Profil Siswa (Publik)" />
          
          <div className="mt-8 px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Admin & Guru</div>
          <SidebarItem viewTarget={View.TEACHER_DASHBOARD} icon={Icons.Chart} label="Dashboard Admin" />
          <SidebarItem viewTarget={View.TEACHER_STUDENTS} icon={Icons.User} label="Kelola Siswa" />
          <SidebarItem viewTarget={View.TEACHER_ASSESSMENTS} icon={Icons.Edit} label="Kelola Penilaian" />
          <SidebarItem viewTarget={View.TEACHER_GRADING} icon={Icons.Sparkles} label="Input Nilai Harian" />
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-xs text-blue-600 font-medium mb-1">Powered by Gemini AI</p>
            <p className="text-xs text-blue-400">Analisis cerdas untuk pendidikan.</p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-[calc(100vh-64px)] md:h-screen">
        {view === View.HOME && <HomeView />}
        {view === View.STUDENT_PORTAL && <StudentPortalView students={data.students} assessments={data.assessments} grades={data.grades} />}
        {view === View.TEACHER_DASHBOARD && <TeacherDashboard data={data} setView={setView} />}
        {view === View.TEACHER_STUDENTS && <ManageStudentsView students={data.students} onAdd={addStudent} onDelete={deleteStudent} />}
        {view === View.TEACHER_ASSESSMENTS && <ManageAssessmentsView assessments={data.assessments} onAdd={addAssessment} onDelete={deleteAssessment} />}
        {view === View.TEACHER_GRADING && <GradingView data={data} onUpdateGrade={updateGrade} />}
      </main>

      {/* Overlay for mobile sidebar */}
      {isMobileMenuOpen && (
        <div 
            className="fixed inset-0 bg-black/50 z-20 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}
    </div>
  );
};

// --- View Components ---

const HomeView = () => (
  <div className="space-y-8 max-w-4xl mx-auto animate-[fadeIn_0.5s_ease-out]">
    <div className="text-center py-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl text-white shadow-lg">
      <h2 className="text-4xl font-bold mb-4">SMA Harapan Bangsa</h2>
      <p className="text-blue-100 text-lg max-w-2xl mx-auto px-4">
        Mewujudkan generasi cerdas, berkarakter, dan berteknologi tinggi dengan sistem penilaian terintegrasi.
      </p>
    </div>

    <div className="grid md:grid-cols-3 gap-6">
      <Card className="hover:shadow-md transition-shadow">
        <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4">
           <Icons.Sparkles />
        </div>
        <h3 className="font-bold text-lg mb-2">Kurikulum Merdeka</h3>
        <p className="text-slate-600">Penerapan kurikulum terbaru dengan fokus pada pengembangan karakter siswa.</p>
      </Card>
      <Card className="hover:shadow-md transition-shadow">
        <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 mb-4">
           <Icons.Chart />
        </div>
        <h3 className="font-bold text-lg mb-2">Monitoring Realtime</h3>
        <p className="text-slate-600">Orang tua dan siswa dapat memantau perkembangan nilai harian secara langsung.</p>
      </Card>
      <Card className="hover:shadow-md transition-shadow">
        <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 mb-4">
           <Icons.User />
        </div>
        <h3 className="font-bold text-lg mb-2">Guru Profesional</h3>
        <p className="text-slate-600">Didukung oleh tenaga pengajar berpengalaman dan tersertifikasi.</p>
      </Card>
    </div>

    <Card title="Pengumuman Sekolah">
      <ul className="space-y-4">
        <li className="flex gap-4">
          <span className="text-sm font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded h-fit">Baru</span>
          <div>
            <h4 className="font-medium text-slate-900">Jadwal Penilaian Tengah Semester</h4>
            <p className="text-slate-600 text-sm">PTS akan dilaksanakan mulai tanggal 15 November 2023. Harap persiapkan diri.</p>
          </div>
        </li>
        <li className="flex gap-4">
           <span className="text-sm font-bold bg-slate-100 text-slate-700 px-2 py-1 rounded h-fit">Info</span>
           <div>
            <h4 className="font-medium text-slate-900">Rapat Wali Murid</h4>
            <p className="text-slate-600 text-sm">Undangan pengambilan rapot sisipan pada hari Sabtu.</p>
          </div>
        </li>
      </ul>
    </Card>
  </div>
);

const StudentPortalView = ({ students, assessments, grades }: AppState) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');

  const selectedStudent = students.find(s => s.id === selectedStudentId);
  const studentGrades = grades.filter(g => g.studentId === selectedStudentId);

  // Calculate generic average
  const average = studentGrades.length > 0 
    ? (studentGrades.reduce((acc, curr) => acc + curr.score, 0) / studentGrades.length).toFixed(1)
    : '0';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 border-b border-slate-200 pb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Profil & Nilai Siswa</h2>
          <p className="text-slate-500">Lihat perkembangan akademik Anda di sini.</p>
        </div>
        <div className="w-full md:w-64">
           <label className="block text-sm font-medium text-slate-700 mb-1">Pilih Siswa (Simulasi Login)</label>
           <select 
             className="w-full border-slate-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
             value={selectedStudentId}
             onChange={(e) => setSelectedStudentId(e.target.value)}
           >
             <option value="">-- Pilih Nama --</option>
             {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.gradeLevel})</option>)}
           </select>
        </div>
      </div>

      {!selectedStudent ? (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300">
           <div className="inline-block p-4 bg-slate-50 rounded-full mb-4">
             <Icons.User />
           </div>
           <p className="text-slate-500 font-medium">Silakan pilih nama siswa untuk melihat data.</p>
        </div>
      ) : (
        <div className="grid gap-6 animate-[fadeIn_0.3s_ease-out]">
            {/* Student Info Card */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-6 items-center">
                <div className="h-20 w-20 bg-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                    {selectedStudent.name.charAt(0)}
                </div>
                <div className="text-center md:text-left flex-1">
                    <h3 className="text-xl font-bold text-slate-900">{selectedStudent.name}</h3>
                    <p className="text-slate-500">NIS: {selectedStudent.nis} | Kelas: {selectedStudent.gradeLevel}</p>
                </div>
                <div className="text-center px-6 py-2 bg-blue-50 rounded-lg">
                    <span className="block text-sm text-blue-600 font-semibold uppercase">Rata-rata Nilai</span>
                    <span className="text-3xl font-bold text-blue-700">{average}</span>
                </div>
            </div>

            {/* Grades List */}
            <Card title="Riwayat Penilaian Harian">
                {studentGrades.length === 0 ? (
                    <p className="text-slate-500 italic text-center py-4">Belum ada data nilai.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-slate-100 text-slate-500 text-sm">
                                    <th className="pb-3 font-medium">Tanggal</th>
                                    <th className="pb-3 font-medium">Mata Pelajaran</th>
                                    <th className="pb-3 font-medium">Judul Penilaian</th>
                                    <th className="pb-3 font-medium text-right">Nilai</th>
                                    <th className="pb-3 font-medium pl-4">Feedback Guru</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {studentGrades.map(grade => {
                                    const assessment = assessments.find(a => a.id === grade.assessmentId);
                                    if (!assessment) return null;
                                    return (
                                        <tr key={grade.id} className="group hover:bg-slate-50">
                                            <td className="py-4 text-slate-600 text-sm">{assessment.date}</td>
                                            <td className="py-4 text-slate-900 font-medium">{assessment.subject}</td>
                                            <td className="py-4 text-slate-600">{assessment.title}</td>
                                            <td className="py-4 text-right">
                                                <span className={`font-bold px-2 py-1 rounded ${
                                                    grade.score >= 80 ? 'bg-green-100 text-green-700' : 
                                                    grade.score >= 60 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                    {grade.score}
                                                </span>
                                            </td>
                                            <td className="py-4 pl-4 text-sm text-slate-500 italic max-w-xs truncate group-hover:whitespace-normal group-hover:overflow-visible">
                                                {grade.feedback || "-"}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </div>
      )}
    </div>
  );
};

const TeacherDashboard = ({ data, setView }: { data: AppState, setView: (v: View) => void }) => {
    // Quick stats
    const totalStudents = data.students.length;
    const totalAssessments = data.assessments.length;
    const recentGrades = data.grades.slice(-5).reverse();

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">Dashboard Admin & Guru</h2>
            
            <div className="grid md:grid-cols-3 gap-6">
                <div onClick={() => setView(View.TEACHER_STUDENTS)} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 cursor-pointer hover:border-blue-400 transition-colors group">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <Icons.User />
                        </div>
                        <span className="text-2xl font-bold text-slate-800">{totalStudents}</span>
                    </div>
                    <h3 className="font-semibold text-slate-700">Total Siswa</h3>
                    <p className="text-sm text-slate-500">Kelola data siswa aktif</p>
                </div>

                <div onClick={() => setView(View.TEACHER_ASSESSMENTS)} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 cursor-pointer hover:border-purple-400 transition-colors group">
                     <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-purple-100 text-purple-600 rounded-lg group-hover:bg-purple-600 group-hover:text-white transition-colors">
                            <Icons.Edit />
                        </div>
                        <span className="text-2xl font-bold text-slate-800">{totalAssessments}</span>
                    </div>
                    <h3 className="font-semibold text-slate-700">Total Penilaian</h3>
                    <p className="text-sm text-slate-500">Kelola jadwal ujian & tugas</p>
                </div>

                <div onClick={() => setView(View.TEACHER_GRADING)} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 cursor-pointer hover:border-green-400 transition-colors group">
                     <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-green-100 text-green-600 rounded-lg group-hover:bg-green-600 group-hover:text-white transition-colors">
                            <Icons.Sparkles />
                        </div>
                        <span className="text-2xl font-bold text-slate-800">{data.grades.length}</span>
                    </div>
                    <h3 className="font-semibold text-slate-700">Nilai Masuk</h3>
                    <p className="text-sm text-slate-500">Input nilai harian siswa</p>
                </div>
            </div>

            <Card title="Aktivitas Penilaian Terakhir">
                <div className="space-y-3">
                    {recentGrades.length === 0 ? <p className="text-slate-500">Belum ada aktivitas.</p> : recentGrades.map(g => {
                        const student = data.students.find(s => s.id === g.studentId);
                        const assessment = data.assessments.find(a => a.id === g.assessmentId);
                        return (
                            <div key={g.id} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                                <div>
                                    <p className="font-medium text-slate-800">{student?.name}</p>
                                    <p className="text-xs text-slate-500">{assessment?.title} • {assessment?.subject}</p>
                                </div>
                                <span className="font-mono font-bold text-blue-600">{g.score}</span>
                            </div>
                        )
                    })}
                </div>
            </Card>
        </div>
    )
}

const ManageStudentsView = ({ students, onAdd, onDelete }: { students: Student[], onAdd: any, onDelete: any }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newStudent, setNewStudent] = useState({ name: '', nis: '', gradeLevel: '' });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAdd(newStudent);
        setIsModalOpen(false);
        setNewStudent({ name: '', nis: '', gradeLevel: '' });
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800">Kelola Data Siswa</h2>
                <Button onClick={() => setIsModalOpen(true)}>+ Tambah Siswa</Button>
            </div>

            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-500 text-sm uppercase">
                            <tr>
                                <th className="px-6 py-3">NIS</th>
                                <th className="px-6 py-3">Nama Lengkap</th>
                                <th className="px-6 py-3">Kelas</th>
                                <th className="px-6 py-3 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {students.map(s => (
                                <tr key={s.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 font-mono text-sm">{s.nis}</td>
                                    <td className="px-6 py-4 font-medium text-slate-900">{s.name}</td>
                                    <td className="px-6 py-4 text-slate-600">{s.gradeLevel}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => onDelete(s.id)} className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-full transition-colors">
                                            <Icons.Trash />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Tambah Siswa Baru">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input label="Nama Lengkap" value={newStudent.name} onChange={e => setNewStudent({...newStudent, name: e.target.value})} required />
                    <Input label="Nomor Induk (NIS)" value={newStudent.nis} onChange={e => setNewStudent({...newStudent, nis: e.target.value})} required />
                    <Input label="Kelas" placeholder="Contoh: 10 IPA 1" value={newStudent.gradeLevel} onChange={e => setNewStudent({...newStudent, gradeLevel: e.target.value})} required />
                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Batal</Button>
                        <Button type="submit">Simpan</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

const ManageAssessmentsView = ({ assessments, onAdd, onDelete }: { assessments: Assessment[], onAdd: any, onDelete: any }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newItem, setNewItem] = useState({ title: '', subject: '', date: '', maxScore: 100 });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAdd(newItem);
        setIsModalOpen(false);
        setNewItem({ title: '', subject: '', date: '', maxScore: 100 });
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800">Kelola Jenis Penilaian</h2>
                <Button onClick={() => setIsModalOpen(true)}>+ Buat Penilaian Baru</Button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {assessments.map(a => (
                    <Card key={a.id} className="relative group">
                         <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button onClick={() => onDelete(a.id)} className="text-red-400 hover:text-red-600 bg-white p-1 rounded shadow"><Icons.Trash /></button>
                         </div>
                         <div className="mb-3">
                             <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">{a.subject}</span>
                         </div>
                         <h3 className="font-bold text-lg text-slate-900 mb-1">{a.title}</h3>
                         <p className="text-sm text-slate-500 mb-4">{a.description || 'Tidak ada deskripsi'}</p>
                         <div className="flex justify-between items-center text-sm border-t border-slate-100 pt-3">
                             <span className="text-slate-500">Tanggal: {a.date}</span>
                             <span className="font-medium text-slate-700">Max: {a.maxScore}</span>
                         </div>
                    </Card>
                ))}
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Buat Penilaian Harian Baru">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input label="Judul Penilaian" placeholder="Contoh: Kuis Aljabar" value={newItem.title} onChange={e => setNewItem({...newItem, title: e.target.value})} required />
                    <Input label="Mata Pelajaran" placeholder="Contoh: Matematika" value={newItem.subject} onChange={e => setNewItem({...newItem, subject: e.target.value})} required />
                    <Input label="Tanggal Pelaksanaan" type="date" value={newItem.date} onChange={e => setNewItem({...newItem, date: e.target.value})} required />
                    <Input label="Skor Maksimal" type="number" value={newItem.maxScore} onChange={e => setNewItem({...newItem, maxScore: parseInt(e.target.value)})} required />
                    <div className="flex justify-end gap-3 pt-4">
                         <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Batal</Button>
                         <Button type="submit">Simpan</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

const GradingView = ({ data, onUpdateGrade }: { data: AppState, onUpdateGrade: any }) => {
    const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>('');
    const [selectedStudentId, setSelectedStudentId] = useState<string>('');
    const [scoreInput, setScoreInput] = useState<number>(0);
    const [feedbackInput, setFeedbackInput] = useState<string>('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState<string | null>(null);

    const assessment = data.assessments.find(a => a.id === selectedAssessmentId);
    const student = data.students.find(s => s.id === selectedStudentId);

    // Auto-fill existing grade if available
    useEffect(() => {
        if(selectedAssessmentId && selectedStudentId) {
            const existing = data.grades.find(g => g.assessmentId === selectedAssessmentId && g.studentId === selectedStudentId);
            if(existing) {
                setScoreInput(existing.score);
                setFeedbackInput(existing.feedback || '');
            } else {
                setScoreInput(0);
                setFeedbackInput('');
            }
        }
    }, [selectedAssessmentId, selectedStudentId, data.grades]);

    const handleGenerateFeedback = async () => {
        if (!student || !assessment) return;
        setIsGenerating(true);
        const suggestion = await generateStudentFeedback(student.name, assessment.title, scoreInput, assessment.maxScore);
        setFeedbackInput(suggestion);
        setIsGenerating(false);
    };

    const handleSave = () => {
        if(!selectedAssessmentId || !selectedStudentId) return;
        onUpdateGrade({
            studentId: selectedStudentId,
            assessmentId: selectedAssessmentId,
            score: scoreInput,
            feedback: feedbackInput
        });
        alert('Nilai berhasil disimpan!');
    };

    const handleAnalyzeClass = async () => {
        if (!assessment) return;
        setIsAnalyzing(true);
        const result = await analyzeClassPerformance(assessment, data.grades, data.students);
        setAnalysisResult(result);
        setIsAnalyzing(false);
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                 <div>
                    <h2 className="text-2xl font-bold text-slate-800">Input Nilai Harian</h2>
                    <p className="text-slate-500">Masukkan nilai dan berikan feedback personal.</p>
                 </div>
                 {assessment && (
                     <Button variant="secondary" onClick={handleAnalyzeClass} isLoading={isAnalyzing}>
                        <Icons.Sparkles /> 
                        <span className="ml-2">Analisis Kelas dengan AI</span>
                     </Button>
                 )}
             </div>
             
             {/* Analysis Result Box */}
             {analysisResult && (
                 <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-xl animate-[fadeIn_0.5s_ease-out]">
                     <div className="flex justify-between items-start mb-2">
                         <h3 className="font-bold text-indigo-800 flex items-center gap-2">
                             <Icons.Sparkles /> Analisis Gemini AI
                         </h3>
                         <button onClick={() => setAnalysisResult(null)} className="text-indigo-400 hover:text-indigo-600">✕</button>
                     </div>
                     <div className="prose prose-sm prose-indigo max-w-none text-indigo-900 whitespace-pre-line">
                         {analysisResult}
                     </div>
                 </div>
             )}

             <div className="grid md:grid-cols-12 gap-6">
                 {/* Left Panel: Selection */}
                 <div className="md:col-span-4 space-y-4">
                     <Card>
                         <div className="space-y-4">
                             <div>
                                 <label className="block text-sm font-medium text-slate-700 mb-2">1. Pilih Penilaian</label>
                                 <select 
                                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={selectedAssessmentId}
                                    onChange={(e) => {
                                        setSelectedAssessmentId(e.target.value);
                                        setAnalysisResult(null);
                                    }}
                                 >
                                     <option value="">-- Pilih --</option>
                                     {data.assessments.map(a => <option key={a.id} value={a.id}>{a.title} ({a.subject})</option>)}
                                 </select>
                             </div>
                             <div>
                                 <label className="block text-sm font-medium text-slate-700 mb-2">2. Pilih Siswa</label>
                                 <select 
                                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={selectedStudentId}
                                    onChange={(e) => setSelectedStudentId(e.target.value)}
                                    disabled={!selectedAssessmentId}
                                 >
                                     <option value="">-- Pilih --</option>
                                     {data.students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                 </select>
                             </div>
                         </div>
                     </Card>
                 </div>

                 {/* Right Panel: Grading Form */}
                 <div className="md:col-span-8">
                     {student && assessment ? (
                         <Card title={`Penilaian: ${student.name}`} subtitle={`${assessment.title} - Max Score: ${assessment.maxScore}`}>
                             <div className="space-y-6">
                                 <div>
                                     <label className="block text-sm font-bold text-slate-700 mb-2">Nilai Perolehan</label>
                                     <div className="flex items-center gap-4">
                                         <input 
                                            type="number" 
                                            className="text-3xl font-bold text-blue-600 border-b-2 border-slate-200 focus:border-blue-600 outline-none w-32 py-2 bg-transparent transition-colors"
                                            value={scoreInput}
                                            onChange={(e) => setScoreInput(Number(e.target.value))}
                                            max={assessment.maxScore}
                                            min={0}
                                         />
                                         <span className="text-slate-400 text-xl">/ {assessment.maxScore}</span>
                                     </div>
                                 </div>

                                 <div>
                                     <div className="flex justify-between items-center mb-2">
                                         <label className="block text-sm font-medium text-slate-700">Catatan / Feedback Guru</label>
                                         <button 
                                            onClick={handleGenerateFeedback} 
                                            disabled={isGenerating}
                                            className="text-xs flex items-center gap-1 text-purple-600 hover:text-purple-700 font-medium bg-purple-50 px-2 py-1 rounded transition-colors"
                                         >
                                             {isGenerating ? 'Generating...' : <><Icons.Sparkles /> Buat dgn AI</>}
                                         </button>
                                     </div>
                                     <textarea 
                                        className="w-full border border-slate-300 rounded-lg p-3 h-32 focus:ring-2 focus:ring-blue-500 outline-none resize-none text-slate-700"
                                        placeholder="Berikan semangat atau saran perbaikan..."
                                        value={feedbackInput}
                                        onChange={(e) => setFeedbackInput(e.target.value)}
                                     />
                                 </div>

                                 <div className="flex justify-end pt-4 border-t border-slate-100">
                                     <Button onClick={handleSave} className="w-full md:w-auto">Simpan Nilai</Button>
                                 </div>
                             </div>
                         </Card>
                     ) : (
                         <div className="h-full flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-dashed border-slate-300 text-slate-400">
                             <Icons.Edit />
                             <p className="mt-2">Pilih penilaian dan siswa untuk memulai grading.</p>
                         </div>
                     )}
                 </div>
             </div>
        </div>
    );
};

export default App;