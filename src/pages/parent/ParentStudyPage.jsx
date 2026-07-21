import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getDailyLog, listDailyLogs } from '../../services/dailyLogsService';
import { formatDateLabel, todayString } from '../../utils/date';
import { mergeSubjectsWithPlan } from '../../utils/subjectsMap';
import OverallStackedBar from '../../components/charts/OverallStackedBar';
import SubjectMeter from '../../components/charts/SubjectMeter';
import Loading from '../../components/common/Loading';
import EmptyState from '../../components/common/EmptyState';
import ErrorMessage from '../../components/common/ErrorMessage';

function IconList() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  );
}

export default function ParentStudyPage() {
  const { session } = useAuth();
  const { date } = useParams();
  const navigate = useNavigate();

  const [log, setLog] = useState(undefined);
  const [error, setError] = useState('');
  const [allDates, setAllDates] = useState([]);
  const [showList, setShowList] = useState(false);
  const [listLogs, setListLogs] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLog(undefined);
    setError('');
    getDailyLog(session.studentId, date)
      .then((data) => { if (!cancelled) setLog(data); })
      .catch(() => { if (!cancelled) setError('기록을 불러오지 못했습니다.'); });
    return () => { cancelled = true; };
  }, [session.studentId, date]);

  useEffect(() => {
    let cancelled = false;
    listDailyLogs(session.studentId)
      .then((logs) => {
        if (!cancelled) {
          setAllDates(logs.map((l) => l.date).sort());
          setListLogs(logs);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [session.studentId]);

  const today = todayString();
  const currentIdx = allDates.indexOf(date);
  const prevDate = currentIdx > 0 ? allDates[currentIdx - 1] : null;
  const nextDate = currentIdx !== -1 && currentIdx < allDates.length - 1 ? allDates[currentIdx + 1] : null;
  const isAtLatest = date >= today;

  function goTo(d) {
    navigate(`/parent/study/${d}`);
  }

  const merged = log ? mergeSubjectsWithPlan(log.subjects, log.plan) : [];

  return (
    <div className="page">
      <div className="page-header">
        <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)', paddingLeft: 4 }}>
          {session?.name ?? '자녀'} 학습
        </span>
        <button
          onClick={() => setShowList(true)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', marginLeft: 'auto' }}
        >
          <IconList />
        </button>
      </div>

      <div className="date-nav">
        <button className="date-nav__btn" onClick={() => prevDate && goTo(prevDate)} disabled={!prevDate}>‹</button>
        <span className="date-nav__label">{formatDateLabel(date)}</span>
        <button className="date-nav__btn" onClick={() => nextDate && goTo(nextDate)} disabled={!nextDate || isAtLatest}>›</button>
      </div>

      {error && <ErrorMessage>{error}</ErrorMessage>}
      {!error && log === undefined && <Loading />}
      {!error && log === null && <EmptyState label="해당 날짜의 기록이 없습니다." />}
      {!error && log && (
        <>
          {log.comment && (
            <div className="subject-section">
              <h3>선생님 코멘트</h3>
              <p className="subject-section__comment">{log.comment}</p>
            </div>
          )}

          {merged.length === 0 ? (
            <EmptyState label="인식된 과목이 없습니다." />
          ) : (
            <>
              <OverallStackedBar subjects={merged} />

              {merged.map((s) => (
                <div className="subject-section" key={s.subject}>
                  <h3>{s.subject}</h3>
                  <SubjectMeter subject={s.subject} percent={s.percent} />
                  {s.planText && <p className="subject-section__plan">계획: {s.planText}</p>}
                  <p className="subject-section__raw">
                    오늘 한 양: {s.rawText !== undefined ? s.rawText : '아직 기록 없음'}
                  </p>
                </div>
              ))}
            </>
          )}
        </>
      )}

      {showList && (
        <div className="modal-overlay" onClick={() => setShowList(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">날짜 목록</h2>
              <button className="modal-close" onClick={() => setShowList(false)}>✕</button>
            </div>
            {listLogs === null ? (
              <Loading />
            ) : listLogs.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '16px 0' }}>기록이 없습니다.</p>
            ) : (
              <ul className="log-list" style={{ maxHeight: '60vh', overflowY: 'auto', margin: 0 }}>
                {listLogs.map((l) => (
                  <li key={l.date}>
                    <button
                      onClick={() => { goTo(l.date); setShowList(false); }}
                      style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '12px 0', textAlign: 'left' }}
                    >
                      <span className="log-date">{formatDateLabel(l.date)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
