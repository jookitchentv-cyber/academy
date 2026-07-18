import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getDailyLog, saveStudentEntry, saveStudentPlan, getAttendanceMap } from '../../services/dailyLogsService';
import { SUBJECTS } from '../../constants/subjects';
import { todayString } from '../../utils/date';
import Loading from '../../components/common/Loading';

const ALL_SUBJECTS = [...SUBJECTS];

const CONFIG = {
  plan: {
    save: saveStudentPlan,
    getExisting: (log) => {
      const result = {};
      for (const s of (log?.plan ?? [])) result[s.subject] = s.rawText ?? '';
      return result;
    },
    placeholder: (subject) => `${subject} 학습 계획을 적어주세요`,
    savedMessage: '오늘 계획이 저장되었습니다.',
  },
  actual: {
    save: saveStudentEntry,
    getExisting: (log) => {
      const result = {};
      for (const s of (log?.subjects ?? [])) result[s.subject] = s.rawText ?? '';
      return result;
    },
    placeholder: (subject) => `${subject} 학습 내용을 적어주세요`,
    savedMessage: '오늘 학습량이 저장되었습니다.',
  },
};

export default function StudyTextInput({ mode }) {
  const { session } = useAuth();
  const [selected, setSelected] = useState({});
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('idle');
  const draftsRef = useRef({});
  const { save, getExisting, placeholder, savedMessage } = CONFIG[mode];

  useEffect(() => {
    let cancelled = false;
    getDailyLog(session.studentId, todayString())
      .then((log) => {
        if (!cancelled) setSelected(getExisting(log));
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.studentId]);

  function toggleSubject(subject) {
    setSelected((prev) => {
      if (subject in prev) {
        draftsRef.current[subject] = prev[subject];
        const next = { ...prev };
        delete next[subject];
        return next;
      }
      return { ...prev, [subject]: draftsRef.current[subject] ?? '' };
    });
    setStatus('idle');
  }

  function handleTextChange(subject, value) {
    setSelected((prev) => ({ ...prev, [subject]: value }));
    setStatus('idle');
  }

  async function handleSave() {
    const hasContent = Object.values(selected).some((t) => t.trim());
    if (!hasContent) return;
    const attendanceMap = await getAttendanceMap(session.studentId).catch(() => new Map());
    if (!attendanceMap.has(todayString())) {
      setStatus('no-attendance');
      return;
    }
    setStatus('saving');
    try {
      await save(session.studentId, todayString(), selected);
      setStatus('saved');
    } catch {
      setStatus('error');
    }
  }

  if (loading) return <Loading />;

  const activeSubjects = ALL_SUBJECTS.filter((s) => s in selected);
  const hasContent = Object.values(selected).some((t) => t.trim());

  return (
    <div style={{ paddingBottom: 72 }}>
      <div className="subject-chips">
        {ALL_SUBJECTS.map((subject) => (
          <button
            key={subject}
            type="button"
            className={`subject-chip ${subject in selected ? 'subject-chip--active' : ''}`}
            onClick={() => toggleSubject(subject)}
          >
            {subject}
          </button>
        ))}
      </div>

      {activeSubjects.length === 0 ? (
        <p className="hint subject-chips-hint" style={{ fontSize: 16, color: 'var(--text-secondary)' }}>과목을 탭해서 선택하세요</p>
      ) : (
        <div className="subject-inputs">
          {activeSubjects.map((subject) => (
            <div key={subject} className="subject-input-group">
              <label className="subject-input-label">{subject}</label>
              <textarea
                className="study-input"
                placeholder={placeholder(subject)}
                value={selected[subject]}
                onChange={(e) => handleTextChange(subject, e.target.value)}
              />
            </div>
          ))}
        </div>
      )}

      <div className="study-save-bar">
        {status === 'saved' && <p className="state-message" style={{ margin: 0 }}>{savedMessage}</p>}
        {status === 'no-attendance' && <p className="state-message state-message--error" style={{ margin: 0 }}>출석 확인을 먼저 해주세요.</p>}
        {status === 'error' && <p className="state-message state-message--error" style={{ margin: 0 }}>저장에 실패했습니다. 다시 시도해주세요.</p>}
        <button
          className="primary-button"
          onClick={handleSave}
          disabled={status === 'saving' || !hasContent}
        >
          {status === 'saving' ? '저장 중...' : '저장'}
        </button>
      </div>
    </div>
  );
}
