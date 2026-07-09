import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getDailyLog } from '../../services/dailyLogsService';
import { formatDateLabel } from '../../utils/date';
import { FALLBACK_SUBJECT } from '../../constants/subjects';
import OverallStackedBar from '../../components/charts/OverallStackedBar';
import SubjectMeter from '../../components/charts/SubjectMeter';
import Loading from '../../components/common/Loading';
import EmptyState from '../../components/common/EmptyState';
import ErrorMessage from '../../components/common/ErrorMessage';

export default function DailyStudyDetail() {
  const { session } = useAuth();
  const { date } = useParams();
  const [log, setLog] = useState(undefined);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    getDailyLog(session.studentId, date)
      .then((data) => {
        if (!cancelled) setLog(data);
      })
      .catch(() => {
        if (!cancelled) setError('기록을 불러오지 못했습니다.');
      });
    return () => {
      cancelled = true;
    };
  }, [session.studentId, date]);

  if (error) return <ErrorMessage>{error}</ErrorMessage>;
  if (log === undefined) return <Loading />;
  if (log === null) return <EmptyState label="해당 날짜의 기록이 없습니다." />;

  const tracked = log.subjects.filter((s) => s.subject !== FALLBACK_SUBJECT);

  return (
    <div>
      <p className="hint" style={{ marginTop: 0 }}>
        <Link to="/student/daily/history" className="back-link">
          ← 목록으로
        </Link>
      </p>
      <h2 style={{ fontSize: 16, marginBottom: 16 }}>{formatDateLabel(date)}</h2>
      {tracked.length === 0 ? (
        <EmptyState label="인식된 과목이 없습니다." />
      ) : (
        <>
          <OverallStackedBar subjects={tracked} />
          {tracked.map((s) => (
            <div className="subject-section" key={s.subject}>
              <h3>{s.subject}</h3>
              <SubjectMeter subject={s.subject} percent={s.percent} />
              <p className="subject-section__raw">{s.rawText}</p>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
