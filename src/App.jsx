import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import RequireRole from './routes/RequireRole';

import LoginPage from './pages/LoginPage';
import NotFound from './pages/NotFound';

import StudentHome from './pages/student/StudentHome';
import DailyStudyLayout from './pages/student/DailyStudyLayout';
import DailyStudyInput from './pages/student/DailyStudyInput';
import DailyStudyHistory from './pages/student/DailyStudyHistory';
import DailyStudyDetail from './pages/student/DailyStudyDetail';
import ExamPrep from './pages/student/ExamPrep';

import TeacherHome from './pages/teacher/TeacherHome';
import StudentMenu from './pages/teacher/StudentMenu';
import TeacherDailyStudyLayout from './pages/teacher/DailyStudyLayout';
import TeacherDailyStudyHistory from './pages/teacher/DailyStudyHistory';
import TeacherDateDetail from './pages/teacher/TeacherDateDetail';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginPage />} />

          <Route element={<RequireRole role="student" />}>
            <Route path="/student" element={<StudentHome />} />
            <Route path="/student/daily" element={<DailyStudyLayout />}>
              <Route index element={<Navigate to="input" replace />} />
              <Route path="input" element={<DailyStudyInput />} />
              <Route path="history" element={<DailyStudyHistory />} />
              <Route path="history/:date" element={<DailyStudyDetail />} />
            </Route>
            <Route path="/student/exam" element={<ExamPrep />} />
          </Route>

          <Route element={<RequireRole role="teacher" />}>
            <Route path="/teacher" element={<TeacherHome />} />
            <Route path="/teacher/students/:studentId" element={<StudentMenu />} />
            <Route path="/teacher/students/:studentId/daily" element={<TeacherDailyStudyLayout />}>
              <Route index element={<Navigate to="history" replace />} />
              <Route path="history" element={<TeacherDailyStudyHistory />} />
              <Route path="history/:date" element={<TeacherDateDetail />} />
            </Route>
            <Route path="/teacher/students/:studentId/exam" element={<ExamPrep />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
