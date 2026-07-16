import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { httpsCallable } from 'firebase/functions';
import { getDailyLog, saveTeacherRatings } from '../../services/dailyLogsService';
import { functions } from '../../firebase/config';
import { formatDateLabel } from '../../utils/date';
import { FALLBACK_SUBJECT } from '../../constants/subjects';
import { mergeSubjectsWithPlan } from '../../utils/subjectsMap';
import OverallStackedBar from '../../components/charts/OverallStackedBar';
import SubjectMeter from '../../components/charts/SubjectMeter';
import Loading from '../../components/common/Loading';
import EmptyState from '../../components/common/EmptyState';
import ErrorMessage from '../../components/common/ErrorMessage';

// 입력창의 빈 문자열은 "아직 안 건드림"이 아니라 명시적으로 null(미평가)로 취급한다.
// 0%는 정당한 평가값이므로 blank와 구분해야 한다.
function toInputValue(percent) {
  return typeof percent === 'number' ? String(percent) : '';
}

export default function TeacherDateDetail() {
  const { studentId, date } = useParams();
  const [log, setLog] = useState(undefined);
  const [error, setError] = useState('');
  const [inputs, setInputs] = useState({});
  const [comment, setComment] = useState('');
  const [saveStatus, setSaveStatus] = useState('idle'); // idle | saving | saved | error
  const [sendStatus, setSendStatus] = useState('idle'); // idle | sending | sent | error

  useEffect(() => {
    let cancelled = false;
    getDailyLog(studentId, date)
      .then((data) => {
        if (cancelled) return;
        setLog(data);
        if (data) {
          const initial = {};
          for (const s of mergeSubjectsWithPlan(data.subjects, data.plan)) {
            initial[s.subject] = toInputValue(s.percent);
          }
          setInputs(initial);
          setComment(data.comment ?? '');
        }
      })
      .catch(() => {
        if (!cancelled) setError('기록을 불러오지 못했습니다.');
      });
    return () => {
      cancelled = true;
    };
  }, [studentId, date]);

  function handleChange(subject, value) {
    setSaveStatus('idle');
    if (value === '') {
      setInputs((prev) => ({ ...prev, [subject]: '' }));
      return;
    }
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
        // 계획만 있고 학습량은 없던 과목에 처음 퍼센트를 매기면 prev.subjects에
        // 아직 그 과목 항목이 없을 수 있다 — map으로는 못 바꾸니 upsert로 처리.
        const bySubject = new Map(prev.subjects.map((s) => [s.subject, s]));
        for (const [subject, percent] of Object.entries(percents)) {
          const existing = bySubject.get(subject);
          bySubject.set(subject, existing ? { ...existing, percent } : { subject, rawText: undefined, percent });
        }
        return { ...prev, subjects: Array.from(bySubject.values()), comment: comment === '' ? null : comment };
      });
      setSaveStatus('saved');
    } catch {
      setSaveStatus('error');
    }
  }

  async function handleSendReport() {
    setSendStatus('sending');
    try {
      const sendDailyReport = httpsCallable(functions, 'sendDailyReport');
      await sendDailyReport({ studentId, date });
      setSendStatus('sent');
      setLog((prev) => prev ? { ...prev, reportSentAt: new Date() } : prev);
    } catch (e) {
      console.error(e);
      setSendStatus('error');
    }
  }

  if (error) return <ErrorMessage>{error}</ErrorMessage>;
  if (log === undefined) return <Loading />;
  if (log === null) return <EmptyState label="해당 날짜의 기록이 없습니다." />;

  // subjects(학습량)만 보면 계획만 쓰고 아직 학습량은 안 쓴 과목이 통째로 빠지므로,
  // 계획/학습량을 과목 기준으로 합쳐서 하나의 목록으로 렌더링한다.
  const merged = mergeSubjectsWithPlan(log.subjects, log.plan);
  const misc = log.subjects.find((s) => s.subject === FALLBACK_SUBJECT);

  return (
    <div>
      <p className="hint" style={{ marginTop: 0 }}>
        <Link to={`/teacher/students/${studentId}/daily/history`} className="back-link">
          ← 목록으로
        </Link>
      </p>
      <h2 style={{ fontSize: 16, marginBottom: 16 }}>{formatDateLabel(date)}</h2>

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
              type="number"
              min={0}
              max={100}
              placeholder="미평가"
              value={inputValue}
              onChange={(e) => handleChange(s.subject, e.target.value)}
            />
            <span className="hint" style={{ display: 'inline', marginLeft: 6 }}>
              %
            </span>
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
          onChange={(e) => {
            setComment(e.target.value);
            setSaveStatus('idle');
          }}
        />
      </div>

      <button className="primary-button" onClick={handleSave} disabled={saveStatus === 'saving'}>
        {saveStatus === 'saving' ? '저장 중...' : '저장'}
      </button>
      {saveStatus === 'saved' && <p className="state-message">저장되었습니다.</p>}
      {saveStatus === 'error' && <p className="state-message state-message--error">저장에 실패했습니다.</p>}

      <div className="subject-section" style={{ marginTop: 24 }}>
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
              <p className="state-message state-message--error">전송에 실패했습니다. 피드백이 저장되어 있는지 확인해주세요.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
