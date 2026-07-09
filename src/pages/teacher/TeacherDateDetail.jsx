import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getDailyLog, saveTeacherRatings } from '../../services/dailyLogsService';
import { formatDateLabel } from '../../utils/date';
import { FALLBACK_SUBJECT } from '../../constants/subjects';
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

  useEffect(() => {
    let cancelled = false;
    getDailyLog(studentId, date)
      .then((data) => {
        if (cancelled) return;
        setLog(data);
        if (data) {
          const initial = {};
          for (const s of data.subjects) {
            if (s.subject !== FALLBACK_SUBJECT) initial[s.subject] = toInputValue(s.percent);
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
      setLog((prev) => ({
        ...prev,
        subjects: prev.subjects.map((s) =>
          s.subject in percents ? { ...s, percent: percents[s.subject] } : s
        ),
        comment: comment === '' ? null : comment,
      }));
      setSaveStatus('saved');
    } catch {
      setSaveStatus('error');
    }
  }

  if (error) return <ErrorMessage>{error}</ErrorMessage>;
  if (log === undefined) return <Loading />;
  if (log === null) return <EmptyState label="해당 날짜의 기록이 없습니다." />;

  const tracked = log.subjects.filter((s) => s.subject !== FALLBACK_SUBJECT);
  const misc = log.subjects.find((s) => s.subject === FALLBACK_SUBJECT);
  const planBySubject = new Map((log.plan ?? []).map((p) => [p.subject, p.rawText]));

  return (
    <div>
      <p className="hint" style={{ marginTop: 0 }}>
        <Link to={`/teacher/students/${studentId}/daily/history`} className="back-link">
          ← 목록으로
        </Link>
      </p>
      <h2 style={{ fontSize: 16, marginBottom: 16 }}>{formatDateLabel(date)}</h2>

      {tracked.length > 0 && <OverallStackedBar subjects={tracked} />}

      {tracked.map((s) => {
        const inputValue = inputs[s.subject] ?? '';
        const previewPercent = inputValue === '' ? null : Number(inputValue);
        return (
          <div className="subject-section" key={s.subject}>
            <h3>{s.subject}</h3>
            <SubjectMeter subject={s.subject} percent={previewPercent} />
            <p className="subject-section__raw">{s.rawText}</p>
            {planBySubject.has(s.subject) && (
              <p className="subject-section__plan">계획: {planBySubject.get(s.subject)}</p>
            )}
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
    </div>
  );
}
