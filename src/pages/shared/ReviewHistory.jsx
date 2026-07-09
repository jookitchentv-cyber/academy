import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { listDailyLogs } from '../../services/dailyLogsService';
import { computeOverallPercent } from '../../utils/computeOverallPercent';
import { formatDateLabel } from '../../utils/date';
import Loading from '../../components/common/Loading';
import EmptyState from '../../components/common/EmptyState';
import ErrorMessage from '../../components/common/ErrorMessage';

// 학생의 "점검" 탭과 학부모 화면이 공유하는 날짜별 기록 리스트.
// 둘 다 session.studentId로 같은 학생의 기록을 보되, 상세 페이지 링크 경로만 다르다.
export default function ReviewHistory() {
  const { session } = useAuth();
  const linkPrefix = session.role === 'parent' ? '/parent/history' : '/student/daily/review';
  const [logs, setLogs] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    listDailyLogs(session.studentId)
      .then((data) => {
        if (!cancelled) setLogs(data);
      })
      .catch(() => {
        if (!cancelled) setError('기록을 불러오지 못했습니다.');
      });
    return () => {
      cancelled = true;
    };
  }, [session.studentId]);

  if (error) return <ErrorMessage>{error}</ErrorMessage>;
  if (logs === null) return <Loading />;
  if (logs.length === 0) return <EmptyState label="아직 기록이 없습니다." />;

  return (
    <ul className="log-list">
      {logs.map((log) => {
        const overall = computeOverallPercent(log.subjects);
        return (
          <li key={log.id}>
            <Link to={`${linkPrefix}/${log.date}`}>
              <span className="log-date">{formatDateLabel(log.date)}</span>
              <span className="log-overall">{overall === null ? '미평가' : `${overall}%`}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
