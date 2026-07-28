import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import RequireRole from './routes/RequireRole';
import { todayString } from './utils/date';

import LoginPage from './pages/LoginPage';
import NotFound from './pages/NotFound';

import StudentLayout from './pages/student/StudentLayout';
import StudentSettings from './pages/student/StudentSettings';
import DailyStudyLayout from './pages/student/DailyStudyLayout';
import StudyTextInput from './pages/student/StudyTextInput';
import StudentReviewPage from './pages/student/StudentReviewPage';
import ExamPrep from './pages/student/ExamPrep';
import StudentAttendanceCalendar from './pages/student/AttendanceCalendar';

import ReviewHistory from './pages/shared/ReviewHistory';
import ReviewDetail from './pages/shared/ReviewDetail';

import ParentLayout from './pages/parent/ParentLayout';
import ParentStudyPage from './pages/parent/ParentStudyPage';
import ParentAttendanceCalendar from './pages/parent/ParentAttendanceCalendar';
import ParentSettings from './pages/parent/ParentSettings';

import TeacherLayout from './pages/teacher/TeacherLayout';
import TeacherHome from './pages/teacher/TeacherHome';
import TeacherSettings from './pages/teacher/TeacherSettings';
import TeacherDailyStudyLayout from './pages/teacher/DailyStudyLayout';
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
            <Route element={<StudentLayout />}>
              <Route path="/student" element={<Navigate to="/student/daily" replace />} />
              <Route path="/student/daily" element={<DailyStudyLayout />}>
                <Route index element={<Navigate to="plan" replace />} />
                <Route path="plan" element={<StudyTextInput key="plan" mode="plan" />} />
                <Route path="actual" element={<StudyTextInput key="actual" mode="actual" />} />
                <Route path="review" element={<Navigate to={todayString()} replace />} />
                <Route path="review/:date" element={<StudentReviewPage />} />
              </Route>
              <Route path="/student/exam" element={<ExamPrep />} />
              <Route path="/student/attendance" element={<StudentAttendanceCalendar />} />
              <Route path="/student/settings" element={<StudentSettings />} />
            </Route>
          </Route>

          <Route element={<RequireRole role="parent" />}>
            <Route element={<ParentLayout />}>
              <Route path="/parent" element={<Navigate to="/parent/study" replace />} />
              <Route path="/parent/study" element={<Navigate to={todayString()} replace />} />
              <Route path="/parent/study/:date" element={<ParentStudyPage />} />
              <Route path="/parent/attendance" element={<ParentAttendanceCalendar />} />
              <Route path="/parent/settings" element={<ParentSettings />} />
            </Route>
          </Route>

          <Route element={<RequireRole role="teacher" />}>
            <Route element={<TeacherLayout />}>
              <Route path="/teacher" element={<TeacherHome />} />
              <Route path="/teacher/students/:studentId/daily" element={<TeacherDailyStudyLayout />}>
                <Route index element={<Navigate to={todayString()} replace />} />
                <Route path=":date" element={<TeacherDateDetail />} />
              </Route>
              <Route path="/teacher/students/:studentId/exam" element={<ExamPrep />} />
              <Route path="/teacher/students/:studentId/attendance" element={<TeacherAttendanceCalendar />} />
              <Route path="/teacher/announcements/new" element={<AnnouncementForm />} />
              <Route path="/teacher/new-student" element={<StudentForm />} />
              <Route path="/teacher/edit-student/:studentId" element={<StudentForm />} />
              <Route path="/teacher/students-table" element={<StudentTable />} />
              <Route path="/teacher/settings" element={<TeacherSettings />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
