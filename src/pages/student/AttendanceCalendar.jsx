import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { listDailyLogs } from '../../services/dailyLogsService';
import { listAnnouncementsForStudent, buildAnnouncementMap } from '../../services/announcementsService';
import { getAttendanceStatus } from '../../utils/attendance';
import MonthCalendar from '../../components/calendar/MonthCalendar';
import Loading from '../../components/common/Loading';
import ErrorMessage from '../../components/common/ErrorMessage';

const today = new Date();

function buildStatusMap(logs, year, month) {
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  const map = new Map();
  for (const log of logs) {
    if (log.date.startsWith(prefix)) map.set(log.date, getAttendanceStatus(log));
  }
  return map;
}

function filterAnnouncementMap(allAnnouncements, year, month) {
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  return buildAnnouncementMap(allAnnouncements.filter((a) => a.date.startsWith(prefix)));
}

export default function AttendanceCalendar() {
  const { session } = useAuth();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [allLogs, setAllLogs] = useState(null);
  const [allAnnouncements, setAllAnnouncements] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      listDailyLogs(session.studentId),
      listAnnouncementsForStudent(session.studentId),
    ])
      .then(([logs, announcements]) => {
        if (!cancelled) {
          setAllLogs(logs);
          setAllAnnouncements(announcements);
        }
      })
      .catch(() => { if (!cancelled) setError('출석 현황을 불러오지 못했습니다.'); });
    return () => { cancelled = true; };
  }, [session.studentId]);

  function prevMonth() {
    if (month === 1) { setYear((y) => y - 1); setMonth(12); }
    else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 12) { setYear((y) => y + 1); setMonth(1); }
    else setMonth((m) => m + 1);
  }

  const statusByDate = allLogs ? buildStatusMap(allLogs, year, month) : null;
  const announcementsByDate = filterAnnouncementMap(allAnnouncements, year, month);

  return (
    <div className="page">
      <div className="page-header">
        <Link to="/student" className="back-link">← 뒤로</Link>
        <h1>출석확인</h1>
        <span />
      </div>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {!error && statusByDate === null && <Loading />}
      {!error && statusByDate && (
        <MonthCalendar
          year={year}
          month={month}
          statusByDate={statusByDate}
          announcementsByDate={announcementsByDate}
          onPrev={prevMonth}
          onNext={nextMonth}
        />
      )}
    </div>
  );
}
