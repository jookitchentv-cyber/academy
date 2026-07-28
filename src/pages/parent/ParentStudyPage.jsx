import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getDailyLog, listDailyLogs } from '../../services/dailyLogsService';
import { getStudent } from '../../services/studentsService';
import { formatDateLabel, todayString } from '../../utils/date';
import { mergeSubjectsWithPlan } from '../../utils/subjectsMap';
import OverallStackedBar from '../../components/charts/OverallStackedBar';
import SubjectMeter from '../../components/charts/SubjectMeter';
import Loading from '../../components/common/Loading';
import EmptyState from '../../components/common/EmptyState';
import ErrorMessage from '../../components/common/ErrorMessage';


export default function ParentStudyPage() {
  const { session } = useAuth();
  const { date } = useParams();
  const navigate = useNavigate();

  const [log, setLog] = useState(undefined);
  const [error, setError] = useState('');
  const [allDates, setAllDates] = useState([]);
  const [showList, setShowList] = useState(false);
  const [listLogs, setListLogs] = useState(null);
  const [memo, setMemo] = useState('');
  const [visibleCount, setVisibleCount] = useState(50);

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
    getStudent(session.studentId).then((s) => { if (s?.memo) setMemo(s.memo); }).catch(() => {});
  }, [session.studentId]);

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
  const prevDate = currentIdx > 0
    ? allDates[currentIdx - 1]
    : currentIdx === -1 && allDates.length > 0
      ? allDates[allDates.length - 1]
      : null;
  const nextDate = currentIdx !== -1 && currentIdx < allDates.length - 1 ? allDates[currentIdx + 1] : null;
  const isAtLatest = date >= today;

  function goTo(d) {
    navigate(`/parent/study/${d}`);
  }

  const merged = log ? mergeSubjectsWithPlan(log.subjects, log.plan) : [];

  return (
    <div className="page">
      <div className="page-header">
        <h1>{session?.name ?? '자녀'} 학습</h1>
      </div>

      <div style={{ paddingTop: 5 }}>
      {memo && (
        <div className="subject-section" style={{ background: '#fff' }}>
          <fieldset style={{ border: '1px solid #ccc', borderRadius: 6, padding: '10px 12px 12px', minWidth: 0, margin: 0 }}>
            <legend style={{ display: 'table', margin: '0 auto', padding: '0 8px', fontSize: 12, fontWeight: 600, color: '#888' }}>📌 메모</legend>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.6, margin: 0, textAlign: 'center' }}>{memo}</p>
          </fieldset>
        </div>
      )}

      <div className="subject-section" style={{ background: '#fff', padding: 0 }}>
        <div className="date-nav" style={{ paddingTop: 10, paddingBottom: 10 }}>
          <button className="date-nav__btn" style={{ marginLeft: 16 }} onClick={() => prevDate && goTo(prevDate)} disabled={!prevDate}>‹</button>
          <button
            onClick={() => { setShowList(true); setVisibleCount(50); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: '2px 4px' }}
          >
            <span className="date-nav__label">{formatDateLabel(date)}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: 12, lineHeight: 1 }}>▼</span>
          </button>
          <button className="date-nav__btn" style={{ marginRight: 16 }} onClick={() => nextDate && goTo(nextDate)} disabled={!nextDate || isAtLatest}>›</button>
        </div>
        {!error && log && merged.length > 0 && <OverallStackedBar subjects={merged} />}
      </div>

      {error && <ErrorMessage>{error}</ErrorMessage>}
      {!error && log === undefined && <Loading />}
      {!error && log === null && <EmptyState label="해당 날짜의 기록이 없습니다." />}
      {!error && log && (
        <>
          {merged.length === 0 && <EmptyState label="인식된 과목이 없습니다." />}
          {merged.map((s) => (
            <div className="subject-section" key={s.subject}>
              <h3 style={{ paddingLeft: 8 }}>{s.subject}</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <SubjectMeter subject={s.subject} percent={s.percent} />
                <div>
                  {s.planText && <p className="subject-section__plan">계획: {s.planText}</p>}
                  <p className="subject-section__raw">
                    오늘 한 양: {s.rawText !== undefined ? s.rawText : '아직 기록 없음'}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {log.comment && (
            <div className="subject-section">
              <h3>선생님 코멘트</h3>
              <p className="subject-section__comment">{log.comment}</p>
            </div>
          )}
        </>
      )}

      </div>

      {showList && (
        <div className="modal-overlay" onClick={() => setShowList(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header" style={{ position: 'relative', justifyContent: 'center', borderBottom: '1px solid #e0e0e0', paddingBottom: 10, marginBottom: 0 }}>
              <h2 className="modal-title">날짜 목록</h2>
              <button className="modal-close" style={{ position: 'absolute', right: 0 }} onClick={() => setShowList(false)}>✕</button>
            </div>
            {listLogs === null ? (
              <Loading />
            ) : listLogs.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '16px 0' }}>기록이 없습니다.</p>
            ) : (() => {
              const reversed = [...listLogs].reverse();
              const visible = reversed.slice(0, visibleCount);
              const hasMore = reversed.length > visibleCount;
              return (
                <ul className="log-list" style={{ maxHeight: '60vh', overflowY: 'auto', margin: 0 }}>
                  {visible.map((l) => (
                    <li key={l.date} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <button
                        onClick={() => { goTo(l.date); setShowList(false); }}
                        style={{ width: '100%', height: 48, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <span className="log-date">{formatDateLabel(l.date)}</span>
                      </button>
                    </li>
                  ))}
                  {hasMore && (
                    <li>
                      <button
                        onClick={() => setVisibleCount((c) => c + 50)}
                        style={{ width: '100%', height: 48, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', fontWeight: 600, fontSize: 14 }}
                      >
                        더 보기
                      </button>
                    </li>
                  )}
                </ul>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
