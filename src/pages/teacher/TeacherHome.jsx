import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { listAnnouncementsForTeacher } from '../../services/announcementsService';
import { todayString } from '../../utils/date';
import { listStudents } from '../../services/studentsService';
import { getDailyLog } from '../../services/dailyLogsService';
import { getAttendanceStatus } from '../../utils/attendance';
import Loading from '../../components/common/Loading';
import EmptyState from '../../components/common/EmptyState';
import ErrorMessage from '../../components/common/ErrorMessage';

export default function TeacherHome() {
  const { session, logout } = useAuth();
  const [students, setStudents] = useState(null);
  const [error, setError] = useState('');
  const [todayAnnouncement, setTodayAnnouncement] = useState(null);
  const [pendingSet, setPendingSet] = useState(new Set());

  useEffect(() => {
    let cancelled = false;
    const today = todayString();
    Promise.all([
      listStudents(),
      listAnnouncementsForTeacher(session.teacherId),
    ])
      .then(([data, announcements]) => {
        if (cancelled) return;
        setStudents(data);
        setTodayAnnouncement(announcements.find((a) => a.date === today) ?? null);
        Promise.all(data.map((s) => getDailyLog(s.studentId, today).catch(() => null)))
          .then((logs) => {
            if (cancelled) return;
            const pending = new Set(
              data.filter((s, i) => getAttendanceStatus(logs[i]) === 'pending').map((s) => s.studentId)
            );
            setPendingSet(pending);
          });
      })
      .catch(() => {
        if (!cancelled) setError('학생 목록을 불러오지 못했습니다.');
      });
    return () => { cancelled = true; };
  }, [session.teacherId]);

  return (
    <div className="page">
      <div className="page-header">
        {students !== null && (
          <span style={{ fontSize: 17, color: 'var(--text-secondary)', fontWeight: 600, paddingLeft: 8 }}>학생수: {students.length}명</span>
        )}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginLeft: 'auto' }}>
          <Link to="/teacher/new-student" className="logout-button" style={{ textDecoration: 'none' }}>
            학생 등록
          </Link>
          <Link to="/teacher/announcements/new" className="logout-button" style={{ textDecoration: 'none' }}>
            공지
          </Link>
          <Link to="/teacher/students-table" className="logout-button" style={{ textDecoration: 'none' }}>
            현황
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
                {pendingSet.has(s.studentId) && (
                  <span className="attendance-pending-badge">출석 대기</span>
                )}
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
