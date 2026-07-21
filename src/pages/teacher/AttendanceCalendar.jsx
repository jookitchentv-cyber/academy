import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getAttendanceMap, getDailyLog, confirmAttendance, forceConfirmAttendance } from '../../services/dailyLogsService';
import { listAnnouncementsForTeacher, buildAnnouncementMap } from '../../services/announcementsService';
import { useAuth } from '../../context/AuthContext';
import { formatDateLabel, todayString } from '../../utils/date';
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

function filterAnnouncementMap(announcements, studentId, year, month) {
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  return buildAnnouncementMap(
    announcements.filter(
      (a) => a.date.startsWith(prefix) && a.targetStudentIds.includes(studentId)
    )
  );
}

export default function TeacherAttendanceCalendar() {
  const { session } = useAuth();
  const { studentId } = useParams();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [allAttendance, setAllAttendance] = useState(null);
  const [allAnnouncements, setAllAnnouncements] = useState([]);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [detail, setDetail] = useState(undefined);
  const [confirming, setConfirming] = useState(false);
  const [forceConfirming, setForceConfirming] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getAttendanceMap(studentId)
      .then((map) => { if (!cancelled) setAllAttendance(map); })
      .catch(() => { if (!cancelled) setError('출석 현황을 불러오지 못했습니다.'); });
    listAnnouncementsForTeacher(session.teacherId)
      .then((announcements) => { if (!cancelled) setAllAnnouncements(announcements); });
    return () => { cancelled = true; };
  }, [studentId]);

  function prevMonth() {
    if (month === 1) { setYear((y) => y - 1); setMonth(12); }
    else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 12) { setYear((y) => y + 1); setMonth(1); }
    else setMonth((m) => m + 1);
  }

  function handleDayClick(date) {
    setSelectedDate(date);
    setDetail(undefined);
    getDailyLog(studentId, date).then(setDetail).catch(() => setDetail(null));
  }

  async function handleForceConfirm() {
    setForceConfirming(true);
    try {
      await forceConfirmAttendance(studentId, selectedDate);
      setAllAttendance((prev) => { const next = new Map(prev); next.set(selectedDate, 'confirmed'); return next; });
      setDetail((prev) => prev ? { ...prev, attendanceConfirmedAt: new Date() } : { attendanceConfirmedAt: new Date() });
    } finally {
      setForceConfirming(false);
    }
  }

  async function handleConfirm() {
    setConfirming(true);
    try {
      await confirmAttendance(studentId, selectedDate);
      setAllAttendance((prev) => {
        const next = new Map(prev);
        next.set(selectedDate, 'confirmed');
        return next;
      });
      setDetail((prev) => prev ? { ...prev, attendanceConfirmedAt: new Date() } : prev);
    } finally {
      setConfirming(false);
    }
  }

  const statusByDate = allAttendance ? buildStatusMap(allAttendance, year, month) : null;
  const announcementsByDate = filterAnnouncementMap(allAnnouncements, studentId, year, month);
  const selectedStatus = selectedDate ? statusByDate?.get(selectedDate) ?? 'none' : null;

  return (
    <div className="page">
      <div className="page-header">
        <Link to="/teacher" className="back-link">← 뒤로</Link>
        <h1>출석확인</h1>
        <span />
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
            onDayClick={handleDayClick}
            onPrev={prevMonth}
            onNext={nextMonth}
          />

          {selectedDate && (
            <div className="subject-section" style={{ marginTop: 16 }}>
              <h3>{formatDateLabel(selectedDate)}</h3>
              {detail === undefined && <Loading />}
              {detail === null && <p className="subject-section__raw">해당 날짜 기록이 없습니다.</p>}
              {selectedStatus === 'none' && detail !== undefined && selectedDate <= todayString() && (
                <button className="primary-button" style={{ marginTop: 8 }} onClick={handleForceConfirm} disabled={forceConfirming}>
                  {forceConfirming ? '처리 중...' : '출석 체크'}
                </button>
              )}
              {detail && (
                <>
                  {selectedStatus === 'none' && null}
                  {selectedStatus === 'pending' && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                      <p className="subject-section__raw" style={{ margin: 0 }}>학생이 출석 버튼을 눌렀습니다.</p>
                      <button className="primary-button" style={{ marginTop: 4 }} onClick={handleConfirm} disabled={confirming}>
                        {confirming ? '처리 중...' : '출석 확인'}
                      </button>
                    </div>
                  )}
                  {selectedStatus === 'confirmed' && (
                    <p className="state-message">✓ 출석 확인 완료</p>
                  )}
                </>
              )}
              {announcementsByDate.get(selectedDate) && (
                <p className="subject-section__raw" style={{ marginTop: 8 }}>
                  📢 {announcementsByDate.get(selectedDate).type === 'cancel' ? '휴강' : '수업시간변경'}
                  {announcementsByDate.get(selectedDate).note ? ` — ${announcementsByDate.get(selectedDate).note}` : ''}
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
