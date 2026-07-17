import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import RequireRole from './routes/RequireRole';

import LoginPage from './pages/LoginPage';
import NotFound from './pages/NotFound';

import StudentHome from './pages/student/StudentHome';
import DailyStudyLayout from './pages/student/DailyStudyLayout';
import StudyTextInput from './pages/student/StudyTextInput';
import ExamPrep from './pages/student/ExamPrep';
import StudentAttendanceCalendar from './pages/student/AttendanceCalendar';

import ReviewHistory from './pages/shared/ReviewHistory';
import ReviewDetail from './pages/shared/ReviewDetail';

import ParentLayout from './pages/parent/ParentLayout';

import TeacherHome from './pages/teacher/TeacherHome';
import StudentMenu from './pages/teacher/StudentMenu';
import TeacherDailyStudyLayout from './pages/teacher/DailyStudyLayout';
import TeacherDailyStudyHistory from './pages/teacher/DailyStudyHistory';
import TeacherDateDetail from './pages/teacher/TeacherDateDetail';
import TeacherAttendanceCalendar from './pages/teacher/AttendanceCalendar';
import AnnouncementForm from './pages/teacher/AnnouncementForm';
import StudentForm from './pages/teacher/StudentForm';
import StudentTable from './pages/teacher/StudentTable';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginPage />} />

          <Route element={<RequireRole role="student" />}>
            <Route path="/student" element={<StudentHome />} />
            <Route path="/student/daily" element={<DailyStudyLayout />}>
              <Route index element={<Navigate to="plan" replace />} />
              <Route path="plan" element={<StudyTextInput key="plan" mode="plan" />} />
              <Route path="actual" element={<StudyTextInput key="actual" mode="actual" />} />
              <Route path="review" element={<ReviewHistory />} />
              <Route path="review/:date" element={<ReviewDetail />} />
            </Route>
            <Route path="/student/exam" element={<ExamPrep />} />
            <Route path="/student/attendance" element={<StudentAttendanceCalendar />} />
          </Route>

          <Route element={<RequireRole role="parent" />}>
            <Route path="/parent" element={<ParentLayout />}>
              <Route index element={<ReviewHistory />} />
              <Route path="history/:date" element={<ReviewDetail />} />
            </Route>
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
            <Route path="/teacher/students/:studentId/attendance" element={<TeacherAttendanceCalendar />} />
            <Route path="/teacher/announcements/new" element={<AnnouncementForm />} />
            <Route path="/teacher/new-student" element={<StudentForm />} />
            <Route path="/teacher/edit-student/:studentId" element={<StudentForm />} />
            <Route path="/teacher/students-table" element={<StudentTable />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
