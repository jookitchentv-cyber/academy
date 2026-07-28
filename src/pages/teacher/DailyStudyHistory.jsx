import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { listDailyLogs } from '../../services/dailyLogsService';
import { computeOverallPercent } from '../../utils/computeOverallPercent';
import { formatDateLabel } from '../../utils/date';
import Loading from '../../components/common/Loading';
import EmptyState from '../../components/common/EmptyState';
import ErrorMessage from '../../components/common/ErrorMessage';

export default function DailyStudyHistory() {
  const { studentId } = useParams();
  const [logs, setLogs] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    listDailyLogs(studentId)
      .then((data) => {
        if (!cancelled) setLogs(data);
      })
      .catch(() => {
        if (!cancelled) setError('기록을 불러오지 못했습니다.');
      });
    return () => {
      cancelled = true;
    };
  }, [studentId]);

  if (error) return <ErrorMessage>{error}</ErrorMessage>;
  if (logs === null) return <Loading />;
  if (logs.length === 0) return <EmptyState label="아직 학생이 작성한 기록이 없습니다." />;

  return (
    <ul className="log-list">
      {logs.map((log) => {
        const overall = computeOverallPercent(log.subjects);
        return (
          <li key={log.id}>
            <Link to={`/teacher/students/${studentId}/daily/history/${log.date}`}>
              <span className="log-date">{formatDateLabel(log.date)}</span>
              <span className="log-overall">{overall === null ? '미평가' : `${overall}%`}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
