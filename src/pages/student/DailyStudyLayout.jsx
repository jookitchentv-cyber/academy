import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getAttendanceMap, requestAttendance } from '../../services/dailyLogsService';
import { todayString } from '../../utils/date';

export default function DailyStudyLayout() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState('none');
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    getAttendanceMap(session.studentId)
      .then((map) => setStatus(map.get(todayString()) ?? 'none'))
      .catch(() => {});
  }, [session.studentId]);

  async function handleClick() {
    if (status === 'pending') {
      navigate('/student/attendance');
      return;
    }
    if (status !== 'none' || requesting) return;
    setRequesting(true);
    try {
      await requestAttendance(session.studentId, todayString());
      setStatus('pending');
    } finally {
      setRequesting(false);
    }
  }

  const btnLabel = status === 'confirmed' ? '✓ 출석완료' : status === 'pending' ? '출석확인중' : requesting ? '처리중...' : '출석하기';
  const btnStyle = {
    border: 'none',
    cursor: status === 'confirmed' ? 'default' : 'pointer',
    padding: '5px 12px',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
    whiteSpace: 'nowrap',
    background: status === 'confirmed' ? 'rgba(99,102,241,0.12)' : status === 'pending' ? '#f0f0f0' : 'var(--accent)',
    color: status === 'confirmed' ? 'var(--accent)' : status === 'pending' ? 'var(--text-muted)' : '#fff',
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>일상 공부</h1>
        <button onClick={handleClick} style={btnStyle}>{btnLabel}</button>
      </div>
      <nav className="tabs">
        <NavLink to="plan" className={({ isActive }) => (isActive ? 'active' : '')}>
          금일 학습 계획
        </NavLink>
        <NavLink to="actual" className={({ isActive }) => (isActive ? 'active' : '')}>
          금일 학습량
        </NavLink>
        <NavLink to="review" className={({ isActive }) => (isActive ? 'active' : '')}>
          점검
        </NavLink>
      </nav>
      <Outlet />
    </div>
  );
}
