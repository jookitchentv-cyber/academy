import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTeacher } from '../../context/TeacherContext';
import { listAnnouncementsForTeacher } from '../../services/announcementsService';
import { todayString } from '../../utils/date';
import { getDailyLog, confirmAttendance } from '../../services/dailyLogsService';
import Loading from '../../components/common/Loading';
import EmptyState from '../../components/common/EmptyState';
import ErrorMessage from '../../components/common/ErrorMessage';
import StudentFormModal from './StudentFormModal';

function IconDaily() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>
  );
}

function IconExam() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
    </svg>
  );
}

function IconAttendance() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
      <polyline points="9 16 11 18 15 14"/>
    </svg>
  );
}

export default function TeacherHome() {
  const { session } = useAuth();
  const { students, error } = useTeacher();
  const [showModal, setShowModal] = useState(false);
  const [todayAnnouncement, setTodayAnnouncement] = useState(null);
  const [statusMap, setStatusMap] = useState(new Map());
  const [confirming, setConfirming] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const today = todayString();
    listAnnouncementsForTeacher(session.teacherId).then((announcements) => {
      if (cancelled) return;
      setTodayAnnouncement(announcements.find((a) => a.date === today) ?? null);
    });
    return () => { cancelled = true; };
  }, [session.teacherId]);

  useEffect(() => {
    if (!students?.length) return;
    let cancelled = false;
    const today = todayString();
    Promise.all(students.map((s) => getDailyLog(s.studentId, today).catch(() => null)))
      .then((logs) => {
        if (cancelled) return;
        const map = new Map();
        students.forEach((s, i) => {
          const log = logs[i];
          if (!log?.attendanceRequestedAt) map.set(s.studentId, 'none');
          else if (!log.attendanceConfirmedAt) map.set(s.studentId, 'pending');
          else if (!log.reportSentAt) map.set(s.studentId, 'studying');
          else map.set(s.studentId, 'departed');
        });
        setStatusMap(map);
      });
    return () => { cancelled = true; };
  }, [students]);

  async function handleConfirm(studentId) {
    setConfirming(studentId);
    try {
      await confirmAttendance(studentId, todayString());
      setStatusMap((prev) => new Map(prev).set(studentId, 'studying'));
    } finally {
      setConfirming(null);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        {students !== null && (
          <span style={{ fontSize: 17, color: 'var(--text-secondary)', fontWeight: 600, paddingLeft: 8 }}>
            학생수: {students.length}명
          </span>
        )}
        <button className="logout-button" onClick={() => setShowModal(true)} style={{ marginLeft: 'auto' }}>
          + 학생 등록
        </button>
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
        <ul className="teacher-student-list">
          {[...students]
            .sort((a, b) => {
              const aP = statusMap.get(a.studentId) === 'pending';
              const bP = statusMap.get(b.studentId) === 'pending';
              return aP === bP ? 0 : aP ? -1 : 1;
            })
            .map((s) => {
            const status = statusMap.get(s.studentId) ?? 'none';
            return (
            <li key={s.studentId} className="teacher-student-item">
              <div className="teacher-student-info">
                <span className="teacher-student-name">{s.name}</span>
                <div className="teacher-student-meta">
                  {s.grade && <span className="teacher-student-grade">{s.grade}</span>}
                  {status === 'pending' && (
                    <button
                      className="day-status-badge day-status-badge--pending"
                      onClick={() => handleConfirm(s.studentId)}
                      disabled={confirming === s.studentId}
                      style={{ border: 'none', cursor: 'pointer' }}
                    >
                      {confirming === s.studentId ? '처리중...' : '출석 대기 ✓'}
                    </button>
                  )}
                  {status === 'studying'  && <span className="day-status-badge day-status-badge--studying">학습중</span>}
                  {status === 'departed'  && <span className="day-status-badge day-status-badge--departed">하원</span>}
                </div>
              </div>
              <div className="teacher-student-actions">
                <Link to={`/teacher/students/${s.studentId}/daily`} className="teacher-student-action">
                  <IconDaily />
                  <span>일상공부</span>
                </Link>
                <Link to={`/teacher/students/${s.studentId}/exam`} className="teacher-student-action">
                  <IconExam />
                  <span>시험대비</span>
                </Link>
                <Link to={`/teacher/students/${s.studentId}/attendance`} className="teacher-student-action">
                  <IconAttendance />
                  <span>출석확인</span>
                </Link>
              </div>
            </li>
            );
          })}
        </ul>
      )}
      {showModal && <StudentFormModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
