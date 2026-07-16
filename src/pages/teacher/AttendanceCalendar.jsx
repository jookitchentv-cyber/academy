import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { listDailyLogs, getDailyLog, confirmAttendance } from '../../services/dailyLogsService';
import { getAttendanceStatus } from '../../utils/attendance';
import { formatDateLabel } from '../../utils/date';
import MonthCalendar from '../../components/calendar/MonthCalendar';
import Loading from '../../components/common/Loading';
import ErrorMessage from '../../components/common/ErrorMessage';

const today = new Date();
const YEAR = today.getFullYear();
const MONTH = today.getMonth() + 1;

export default function TeacherAttendanceCalendar() {
  const { studentId } = useParams();
  const [statusByDate, setStatusByDate] = useState(null);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [detail, setDetail] = useState(undefined);
  const [confirming, setConfirming] = useState(false);

  function loadMonth() {
    return listDailyLogs(studentId).then((logs) => {
      const prefix = `${YEAR}-${String(MONTH).padStart(2, '0')}`;
      const map = new Map();
      for (const log of logs) {
        if (log.date.startsWith(prefix)) map.set(log.date, getAttendanceStatus(log));
      }
      setStatusByDate(map);
    });
  }

  useEffect(() => {
    let cancelled = false;
    loadMonth().catch(() => {
      if (!cancelled) setError('출석 현황을 불러오지 못했습니다.');
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  function handleDayClick(date) {
    setSelectedDate(date);
    setDetail(undefined);
    getDailyLog(studentId, date)
      .then(setDetail)
      .catch(() => setDetail(null));
  }

  async function handleConfirm() {
    setConfirming(true);
    try {
      await confirmAttendance(studentId, selectedDate);
      await loadMonth();
      setDetail((prev) =>
        prev ? { ...prev, attendanceConfirmedAt: new Date() } : prev
      );
    } finally {
      setConfirming(false);
    }
  }

  const selectedStatus = selectedDate ? statusByDate?.get(selectedDate) ?? 'none' : null;

  return (
    <div className="page">
      <div className="page-header">
        <Link to={`/teacher/students/${studentId}`} className="back-link">
          ← 뒤로
        </Link>
        <h1>출석확인</h1>
        <span />
      </div>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {!error && statusByDate === null && <Loading />}
      {!error && statusByDate && (
        <>
          <MonthCalendar year={YEAR} month={MONTH} statusByDate={statusByDate} onDayClick={handleDayClick} />

          {selectedDate && (
            <div className="subject-section" style={{ marginTop: 16 }}>
              <h3>{formatDateLabel(selectedDate)}</h3>
              {detail === undefined && <Loading />}
              {detail === null && <p className="subject-section__raw">해당 날짜 기록이 없습니다.</p>}
              {detail && (
                <>
                  {selectedStatus === 'none' && (
                    <p className="subject-section__raw">출석 요청이 없는 날짜입니다.</p>
                  )}
                  {selectedStatus === 'pending' && (
                    <>
                      <p className="subject-section__raw">학생이 출석 버튼을 눌렀습니다.</p>
                      <button className="primary-button" style={{ marginTop: 10 }} onClick={handleConfirm} disabled={confirming}>
                        {confirming ? '처리 중...' : '출석 확인'}
                      </button>
                    </>
                  )}
                  {selectedStatus === 'confirmed' && (
                    <p className="state-message">출석 확인 완료 — 부모님께 등원 알림이 발송되었습니다.</p>
                  )}
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
