import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { httpsCallable } from 'firebase/functions';
import { subscribeDailyLog, listDailyLogs, saveTeacherRatings } from '../../services/dailyLogsService';
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
  const prevDate = currentIdx > 0 ? allDates[currentIdx - 1] : null;
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

  return (
    <div>
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

      <div className="date-nav">
        <button
          className="date-nav__btn"
          onClick={() => prevDate && goTo(prevDate)}
          disabled={!prevDate}
        >
          ‹
        </button>
        <span className="date-nav__label">{formatDateLabel(date)}</span>
        <button
          className="date-nav__btn"
          onClick={() => nextDate && goTo(nextDate)}
          disabled={!nextDate || isAtLatest}
        >
          ›
        </button>
      </div>

      {error && <ErrorMessage>{error}</ErrorMessage>}
      {!error && log === undefined && <Loading />}
      {!error && log === null && <EmptyState label="해당 날짜의 기록이 없습니다." />}
      {!error && log && (() => {
        const merged = mergeSubjectsWithPlan(log.subjects, log.plan);
        const misc = log.subjects.find((s) => s.subject === FALLBACK_SUBJECT);
        return (
          <>
            {merged.length > 0 && <OverallStackedBar subjects={merged} />}

            {merged.map((s) => {
              const inputValue = inputs[s.subject] ?? '';
              const previewPercent = inputValue === '' ? null : Number(inputValue);
              return (
                <div className="subject-section" key={s.subject}>
                  <h3>{s.subject}</h3>
                  <SubjectMeter subject={s.subject} percent={previewPercent} />
                  {s.planText && <p className="subject-section__plan">계획: {s.planText}</p>}
                  <p className="subject-section__raw">
                    오늘 한 양: {s.rawText !== undefined ? s.rawText : '아직 기록 없음'}
                  </p>
                  <input
                    type="number" min={0} max={100} placeholder="미평가"
                    value={inputValue}
                    onChange={(e) => handleChange(s.subject, e.target.value)}
                  />
                  <span className="hint" style={{ display: 'inline', marginLeft: 6 }}>%</span>
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
                style={{ minHeight: 80 }}
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

            <div className="subject-section" style={{ marginTop: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
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
                    disabled={sendStatus === 'sending' || !log.departureTime || !comment.trim()}
                  >
                    {sendStatus === 'sending' ? '전송 중...' : '부모님께 전송'}
                  </button>
                  {!log.departureTime && (
                    <p className="hint" style={{ marginTop: 6 }}>학생이 아직 학습량을 저장하지 않았습니다.</p>
                  )}
                  {sendStatus === 'sent' && <p className="state-message">전송이 완료되었습니다.</p>}
                  {sendStatus === 'error' && (
                    <p className="state-message state-message--error">전송 실패: {sendError}</p>
                  )}
                </>
              )}
            </div>
          </>
        );
      })()}
    </div>
  );
}
