import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { httpsCallable } from 'firebase/functions';
import { subscribeDailyLog, listDailyLogs, saveTeacherRatings } from '../../services/dailyLogsService';
import { getStudent } from '../../services/studentsService';
import { functions } from '../../firebase/config';
import { formatDateLabel, todayString } from '../../utils/date';
import { FALLBACK_SUBJECT } from '../../constants/subjects';
import { mergeSubjectsWithPlan } from '../../utils/subjectsMap';
import OverallStackedBar from '../../components/charts/OverallStackedBar';
import SubjectMeter from '../../components/charts/SubjectMeter';
import Loading from '../../components/common/Loading';
import EmptyState from '../../components/common/EmptyState';
import ErrorMessage from '../../components/common/ErrorMessage';

function toInputValue(percent) {
  return typeof percent === 'number' ? String(percent) : '';
}


export default function TeacherDateDetail() {
  const { studentId, date } = useParams();
  const navigate = useNavigate();

  const [log, setLog] = useState(undefined);
  const [error, setError] = useState('');
  const [inputs, setInputs] = useState({});
  const [comment, setComment] = useState('');
  const [saveStatus, setSaveStatus] = useState('idle');
  const [sendStatus, setSendStatus] = useState('idle');
  const [sendError, setSendError] = useState('');
  const [memo, setMemo] = useState('');
  const [studentName, setStudentName] = useState('');
  const [showList, setShowList] = useState(false);
  const [visibleCount, setVisibleCount] = useState(50);

  const [allDates, setAllDates] = useState([]);

  useEffect(() => {
    let isFirst = true;
    setLog(undefined);
    setError('');
    const unsub = subscribeDailyLog(
      studentId,
      date,
      (data) => {
        setLog(data);
        if (data && isFirst) {
          isFirst = false;
          const initial = {};
          for (const s of mergeSubjectsWithPlan(data.subjects, data.plan)) {
            initial[s.subject] = toInputValue(s.percent);
          }
          setInputs(initial);
          setComment(data.comment ?? '');
        }
      },
      () => setError('기록을 불러오지 못했습니다.'),
    );
    return unsub;
  }, [studentId, date]);

  useEffect(() => {
    getStudent(studentId).then((s) => {
      if (s?.memo) setMemo(s.memo);
      if (s?.name) setStudentName(s.name);
    }).catch(() => {});
  }, [studentId]);

  useEffect(() => {
    let cancelled = false;
    listDailyLogs(studentId)
      .then((logs) => {
        if (!cancelled) setAllDates(logs.map((l) => l.date).sort());
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [studentId]);

  const today = todayString();
  const currentIdx = allDates.indexOf(date);
  const effectiveIdx = currentIdx !== -1 ? currentIdx : allDates.length;
  const prevDate = effectiveIdx > 0 ? allDates[effectiveIdx - 1] : null;
  const nextDate = currentIdx !== -1 && currentIdx < allDates.length - 1 ? allDates[currentIdx + 1] : null;
  const isAtLatest = date >= today;

  function goTo(d) {
    navigate(`/teacher/students/${studentId}/daily/${d}`);
    setLog(undefined);
    setError('');
    setSaveStatus('idle');
    setSendStatus('idle');
  }

  function handleChange(subject, value) {
    setSaveStatus('idle');
    if (value === '') { setInputs((prev) => ({ ...prev, [subject]: '' })); return; }
    const num = Math.max(0, Math.min(100, Number(value)));
    setInputs((prev) => ({ ...prev, [subject]: String(num) }));
  }

  async function handleSave() {
    setSaveStatus('saving');
    const percents = {};
    for (const [subject, value] of Object.entries(inputs)) {
      percents[subject] = value === '' ? null : Number(value);
    }
    try {
      await saveTeacherRatings(studentId, date, percents, comment);
      setLog((prev) => {
        const bySubject = new Map(prev.subjects.map((s) => [s.subject, s]));
        for (const [subject, percent] of Object.entries(percents)) {
          const existing = bySubject.get(subject);
          bySubject.set(subject, existing ? { ...existing, percent } : { subject, rawText: undefined, percent });
        }
        return { ...prev, subjects: Array.from(bySubject.values()), comment: comment === '' ? null : comment };
      });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 1000);
    } catch {
      setSaveStatus('error');
    }
  }

  async function handleSendReport() {
    setSendStatus('sending');
    try {
      if (saveStatus !== 'saved') {
        const percents = {};
        for (const [subject, value] of Object.entries(inputs)) {
          percents[subject] = value === '' ? null : Number(value);
        }
        await saveTeacherRatings(studentId, date, percents, comment);
        setSaveStatus('saved');
      }
      const sendDailyReport = httpsCallable(functions, 'sendDailyReport');
      await sendDailyReport({ studentId, date });
      setSendStatus('sent');
      setLog((prev) => prev ? { ...prev, reportSentAt: new Date() } : prev);
    } catch (e) {
      console.error(e);
      setSendError(e?.message ?? '알 수 없는 오류');
      setSendStatus('error');
    }
  }

  const merged = log ? mergeSubjectsWithPlan(log.subjects, log.plan) : [];
  const misc = log?.subjects?.find((s) => s.subject === FALLBACK_SUBJECT);

  return (
    <div style={{ paddingTop: 5 }}>
      {saveStatus === 'saved' && (
        <div style={{
          position: 'fixed', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(0,0,0,0.75)', color: '#fff',
          padding: '14px 28px', borderRadius: 12, fontSize: 16,
          fontWeight: 600, zIndex: 9999, pointerEvents: 'none',
        }}>
          저장되었습니다
        </div>
      )}

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
          <button
            className="date-nav__btn"
            style={{ marginLeft: 16 }}
            onClick={() => prevDate && goTo(prevDate)}
            disabled={!prevDate}
          >
            ‹
          </button>
          <button
            onClick={() => { setShowList(true); setVisibleCount(50); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: '2px 4px' }}
          >
            <span className="date-nav__label">{formatDateLabel(date)}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: 12, lineHeight: 1 }}>▼</span>
          </button>
          <button
            className="date-nav__btn"
            style={{ marginRight: 16 }}
            onClick={() => nextDate && goTo(nextDate)}
            disabled={!nextDate || isAtLatest}
          >
            ›
          </button>
        </div>
        {!error && log && merged.length > 0 && <OverallStackedBar subjects={merged} />}
      </div>

      {error && <ErrorMessage>{error}</ErrorMessage>}
      {!error && log === undefined && <Loading />}
      {!error && log === null && <EmptyState label="해당 날짜의 기록이 없습니다." />}
      {!error && log && (
          <>

            {merged.map((s) => {
              const inputValue = inputs[s.subject] ?? '';
              const previewPercent = inputValue === '' ? null : Number(inputValue);
              return (
                <div className="subject-section" key={s.subject}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <h3 style={{ margin: 0, paddingLeft: 8 }}>{s.subject}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <input
                        type="number" min={0} max={100} placeholder="미평가"
                        value={inputValue}
                        onChange={(e) => handleChange(s.subject, e.target.value)}
                      />
                      <span className="hint">%</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <SubjectMeter subject={s.subject} percent={previewPercent} />
                    <div style={{ flex: 1 }}>
                      {s.planText && <p className="subject-section__plan">계획: {s.planText}</p>}
                      <p className="subject-section__raw">
                        오늘 한 양: {s.rawText !== undefined ? s.rawText : '아직 기록 없음'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}

            {misc && (
              <div className="subject-section">
                <h3>기타</h3>
                <p className="subject-section__raw">{misc.rawText}</p>
              </div>
            )}

            <div className="subject-section">
              <h3>코멘트 (학부모에게 공개, 학생에게는 비공개)</h3>
              <textarea
                className="study-input"
                style={{ minHeight: 330, resize: 'none' }}
                placeholder="학부모에게만 보여줄 코멘트를 적어주세요."
                value={comment}
                onChange={(e) => { setComment(e.target.value); setSaveStatus('idle'); }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <button className="primary-button" onClick={handleSave} disabled={saveStatus === 'saving'}>
                {saveStatus === 'saving' ? '저장 중...' : '저장'}
              </button>
              {saveStatus === 'error' && <p className="state-message state-message--error">저장에 실패했습니다.</p>}
            </div>

            <div className="subject-section" style={{ marginTop: 10, paddingBottom: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <h3>부모님께 하원 보고 전송</h3>
              {log.reportSentAt ? (
                <p className="state-message">이미 전송된 날짜입니다.</p>
              ) : (
                <>
                  <p className="hint" style={{ marginBottom: 8 }}>
                    피드백 저장 후 전송하세요. 하원 시간·학습목표·학습량·피드백이 함께 발송됩니다.
                  </p>
                  <button
                    className="primary-button"
                    onClick={handleSendReport}
                    disabled={sendStatus === 'sending' || !comment.trim()}
                  >
                    {sendStatus === 'sending' ? '전송 중...' : '부모님께 전송'}
                  </button>
                  {sendStatus === 'sent' && <p className="state-message">전송이 완료되었습니다.</p>}
                  {sendStatus === 'error' && (
                    <p className="state-message state-message--error">전송 실패: {sendError}</p>
                  )}
                </>
              )}
            </div>

          </>
      )}

      {showList && (
        <div className="modal-overlay" onClick={() => setShowList(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header" style={{ position: 'relative', justifyContent: 'center', borderBottom: '1px solid #e0e0e0', paddingBottom: 10, marginBottom: 0 }}>
              <h2 className="modal-title">날짜 목록</h2>
              <button className="modal-close" style={{ position: 'absolute', right: 0 }} onClick={() => setShowList(false)}>✕</button>
            </div>
            {(() => {
              const reversed = [...allDates].reverse();
              const visible = reversed.slice(0, visibleCount);
              const hasMore = reversed.length > visibleCount;
              return (
                <ul className="log-list" style={{ maxHeight: '60vh', overflowY: 'auto', margin: 0 }}>
                  {visible.map((d) => (
                    <li key={d} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <button
                        onClick={() => { goTo(d); setShowList(false); }}
                        style={{ width: '100%', height: 48, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <span className="log-date">{formatDateLabel(d)}</span>
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
