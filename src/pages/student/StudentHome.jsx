import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getDailyLog, requestAttendance } from '../../services/dailyLogsService';
import { getAttendanceStatus } from '../../utils/attendance';
import { todayString } from '../../utils/date';
import iconDaily from '../../assets/icon-daily.png';
import iconExam from '../../assets/icon-exam.png';
import iconAttendance from '../../assets/icon-attendance.png';

export default function StudentHome() {
  const { session, logout } = useAuth();
  const [attendanceStatus, setAttendanceStatus] = useState('none');
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getDailyLog(session.studentId, todayString())
      .then((log) => {
        if (!cancelled) setAttendanceStatus(getAttendanceStatus(log));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [session.studentId]);

  async function handleAttendance() {
    setRequesting(true);
    try {
      await requestAttendance(session.studentId, todayString());
      setAttendanceStatus('pending');
    } finally {
      setRequesting(false);
    }
  }

  return (
    <div className="page student-home-page">
      <div className="page-header">
        <h1>{session?.name ?? '학생'}님</h1>
        <button className="logout-button" onClick={logout}>
          로그아웃
        </button>
      </div>

      <div className="attendance-banner">
        {attendanceStatus === 'none' && (
          <button
            className="primary-button attendance-button"
            onClick={handleAttendance}
            disabled={requesting}
          >
            {requesting ? '처리 중...' : '출석 체크'}
          </button>
        )}
        {attendanceStatus === 'pending' && (
          <div className="attendance-status attendance-status--pending">
            출석 확인 중... (선생님 승인 대기)
          </div>
        )}
        {attendanceStatus === 'confirmed' && (
          <div className="attendance-status attendance-status--confirmed">
            ✓ 오늘 출석이 확인되었습니다
          </div>
        )}
      </div>

      <ul className="menu-list student-menu-list">
        <li>
          <Link to="/student/daily">
            <img src={iconDaily} alt="" className="menu-icon-rounded" />
            <span className="role-text">
              <span className="role-title">일상 공부</span>
              <span className="role-subtitle">오늘의 학습을 확인해요</span>
            </span>
            <span className="role-chevron">›</span>
          </Link>
        </li>
        <li>
          <Link to="/student/exam">
            <img src={iconExam} alt="" className="menu-icon-rounded" />
            <span className="role-text">
              <span className="role-title">시험 대비</span>
              <span className="role-subtitle">시험 준비를 체계적으로!</span>
            </span>
            <span className="role-chevron">›</span>
          </Link>
        </li>
        <li>
          <Link to="/student/attendance">
            <img src={iconAttendance} alt="" className="menu-icon-rounded" />
            <span className="role-text">
              <span className="role-title">출석 확인</span>
              <span className="role-subtitle">출석 현황을 확인하세요</span>
            </span>
            <span className="role-chevron">›</span>
          </Link>
        </li>
      </ul>
    </div>
  );
}
