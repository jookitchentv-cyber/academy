import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { listAnnouncementsForTeacher } from '../../services/announcementsService';
import { todayString } from '../../utils/date';
import { listStudents } from '../../services/studentsService';
import Loading from '../../components/common/Loading';
import EmptyState from '../../components/common/EmptyState';
import ErrorMessage from '../../components/common/ErrorMessage';

export default function TeacherHome() {
  const { session, logout } = useAuth();
  const [students, setStudents] = useState(null);
  const [error, setError] = useState('');
  const [todayAnnouncement, setTodayAnnouncement] = useState(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      listStudents(),
      listAnnouncementsForTeacher(session.teacherId),
    ])
      .then(([data, announcements]) => {
        if (!cancelled) {
          setStudents(data);
          const today = todayString();
          setTodayAnnouncement(announcements.find((a) => a.date === today) ?? null);
        }
      })
      .catch(() => {
        if (!cancelled) setError('학생 목록을 불러오지 못했습니다.');
      });
    return () => { cancelled = true; };
  }, [session.teacherId]);

  return (
    <div className="page">
      <div className="page-header">
        <h1>담당 학생</h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Link to="/teacher/new-student" className="logout-button" style={{ textDecoration: 'none' }}>
            학생 등록
          </Link>
          <Link to="/teacher/announcements/new" className="logout-button" style={{ textDecoration: 'none' }}>
            공지 등록
          </Link>
          <button className="logout-button" onClick={logout}>로그아웃</button>
        </div>
      </div>
      {todayAnnouncement && (
        <div className={`today-announce today-announce--${todayAnnouncement.type}`}>
          📢 오늘{' '}
          {todayAnnouncement.type === 'cancel' ? '휴강' : '수업시간변경'}
          {todayAnnouncement.note ? ` — ${todayAnnouncement.note}` : ''}
        </div>
      )}
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {!error && students === null && <Loading />}
      {!error && students?.length === 0 && <EmptyState label="등록된 학생이 없습니다." />}
      {!error && students?.length > 0 && (
        <ul className="menu-list">
          {students.map((s) => (
            <li key={s.studentId} className="student-list-item">
              <Link to={`/teacher/students/${s.studentId}`}>
                {s.name}
                {s.grade && <span className="student-list-grade">{s.grade}</span>}
              </Link>
              <Link to={`/teacher/edit-student/${s.studentId}`} className="student-list-edit">
                수정
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
