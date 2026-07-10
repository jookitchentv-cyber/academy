import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { listDailyLogs } from '../../services/dailyLogsService';
import { getAttendanceStatus } from '../../utils/attendance';
import MonthCalendar from '../../components/calendar/MonthCalendar';
import Loading from '../../components/common/Loading';
import ErrorMessage from '../../components/common/ErrorMessage';

const today = new Date();
const YEAR = today.getFullYear();
const MONTH = today.getMonth() + 1;

export default function AttendanceCalendar() {
  const { session } = useAuth();
  const [statusByDate, setStatusByDate] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    listDailyLogs(session.studentId)
      .then((logs) => {
        if (cancelled) return;
        const prefix = `${YEAR}-${String(MONTH).padStart(2, '0')}`;
        const map = new Map();
        for (const log of logs) {
          if (log.date.startsWith(prefix)) map.set(log.date, getAttendanceStatus(log));
        }
        setStatusByDate(map);
      })
      .catch(() => {
        if (!cancelled) setError('출석 현황을 불러오지 못했습니다.');
      });
    return () => {
      cancelled = true;
    };
  }, [session.studentId]);

  return (
    <div className="page">
      <div className="page-header">
        <Link to="/student" className="back-link">
          ← 뒤로
        </Link>
        <h1>출석확인</h1>
        <span />
      </div>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {!error && statusByDate === null && <Loading />}
      {!error && statusByDate && <MonthCalendar year={YEAR} month={MONTH} statusByDate={statusByDate} />}
    </div>
  );
}
