import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getAttendanceMap } from '../../services/dailyLogsService';
import { listAnnouncementsForStudent, buildAnnouncementMap } from '../../services/announcementsService';
import MonthCalendar from '../../components/calendar/MonthCalendar';
import Loading from '../../components/common/Loading';
import ErrorMessage from '../../components/common/ErrorMessage';

const today = new Date();

function buildStatusMap(attendanceMap, year, month) {
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  const map = new Map();
  for (const [date, status] of attendanceMap) {
    if (date.startsWith(prefix)) map.set(date, status);
  }
  return map;
}

function filterAnnouncementMap(allAnnouncements, year, month) {
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  return buildAnnouncementMap(allAnnouncements.filter((a) => a.date.startsWith(prefix)));
}

export default function ParentAttendanceCalendar() {
  const { session } = useAuth();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [allAttendance, setAllAttendance] = useState(null);
  const [allAnnouncements, setAllAnnouncements] = useState([]);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getAttendanceMap(session.studentId)
      .then((map) => { if (!cancelled) setAllAttendance(map); })
      .catch(() => { if (!cancelled) setError('출석 현황을 불러오지 못했습니다.'); });
    listAnnouncementsForStudent(session.studentId)
      .then((announcements) => { if (!cancelled) setAllAnnouncements(announcements); });
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

  const statusByDate = allAttendance ? buildStatusMap(allAttendance, year, month) : null;
  const announcementsByDate = filterAnnouncementMap(allAnnouncements, year, month);

  function handleDayClick(date) {
    setSelectedDate((prev) => prev === date ? null : date);
  }

  const selectedAnnounce = selectedDate ? announcementsByDate.get(selectedDate) : null;
  const selectedStatus = selectedDate ? statusByDate?.get(selectedDate) ?? 'none' : null;
  const ANNOUNCE_LABEL = { cancel: '휴강', time_change: '수업시간 변경' };

  return (
    <div className="page">
      <div className="page-header">
        <h1>출석 현황</h1>
      </div>

      {error && <ErrorMessage>{error}</ErrorMessage>}
      {!error && statusByDate === null && <Loading />}
      {!error && statusByDate && (
        <>
          <MonthCalendar
            year={year}
            month={month}
            statusByDate={statusByDate}
            announcementsByDate={announcementsByDate}
            onPrev={prevMonth}
            onNext={nextMonth}
            onDayClick={handleDayClick}
          />
          {selectedDate && (
            <div className="subject-section" style={{ marginTop: 16 }}>
              <h3>{selectedDate}</h3>
              {selectedStatus === 'pending' && <p className="subject-section__raw">출석 확인 대기 중입니다.</p>}
              {selectedStatus === 'confirmed' && <p className="state-message">✓ 출석 확인 완료</p>}
              {selectedStatus === 'none' && !selectedAnnounce && <p className="subject-section__raw">출석 기록이 없는 날짜입니다.</p>}
              {selectedAnnounce && (
                <p className="subject-section__raw" style={{ marginTop: 8 }}>
                  📢 {ANNOUNCE_LABEL[selectedAnnounce.type]}
                  {selectedAnnounce.note ? ` — ${selectedAnnounce.note}` : ''}
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
