import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getDailyLog, saveStudentEntry, saveStudentPlan } from '../../services/dailyLogsService';
import { todayString } from '../../utils/date';
import Loading from '../../components/common/Loading';

const CONFIG = {
  plan: {
    save: saveStudentPlan,
    getExisting: (log) => log?.planRawText ?? '',
    placeholder: '오늘 계획한 학습 내용을 적어주세요. 예: 수학 쎈 53페이지부터 100페이지까지 풀 예정이다.',
    savedMessage: '오늘 계획이 저장되었습니다.',
  },
  actual: {
    save: saveStudentEntry,
    getExisting: (log) => log?.rawText ?? '',
    placeholder: '오늘 실제로 공부한 내용을 적어주세요. 예: 수학 쎈 53페이지부터 100페이지까지 풀었다.',
    savedMessage: '오늘 학습량이 저장되었습니다.',
  },
};

// "금일 학습 계획"과 "금일 학습량"은 같은 입력 UI를 쓰지만 서로 다른 데이터로
// 저장된다(mode에 따라 다른 서비스 함수 호출) — 계획은 채점 대상이 아닌 참고용,
// 학습량은 선생님이 채점하는 실제 기록. 오늘 이미 저장한 내용이 있으면 불러와서
// 수정할 수 있게 한다 — 매번 빈 칸에서 새로 쓰는 게 아니라 이어서 고쳐 쓰는 것.
export default function StudyTextInput({ mode }) {
  const { session } = useAuth();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('idle'); // idle | saving | saved | error
  const { save, getExisting, placeholder, savedMessage } = CONFIG[mode];

  useEffect(() => {
    let cancelled = false;
    getDailyLog(session.studentId, todayString())
      .then((log) => {
        if (!cancelled) setText(getExisting(log));
      })
      .catch(() => {
        // 오늘 기록이 없거나 조회에 실패해도 그냥 빈 칸으로 시작하면 됨
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.studentId]);

  async function handleSave() {
    if (!text.trim()) return;
    setStatus('saving');
    try {
      await save(session.studentId, todayString(), text);
      setStatus('saved');
    } catch {
      setStatus('error');
    }
  }

  if (loading) return <Loading />;

  return (
    <div>
      <textarea
        className="study-input"
        placeholder={placeholder}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          if (status !== 'idle') setStatus('idle');
        }}
      />
      <p className="hint">과목명(국어, 수학, 영어, 과학, 사회, 한국사)을 문장 앞에 적어주세요.</p>
      <button className="primary-button" onClick={handleSave} disabled={status === 'saving' || !text.trim()}>
        {status === 'saving' ? '저장 중...' : '저장'}
      </button>
      {status === 'saved' && <p className="state-message">{savedMessage}</p>}
      {status === 'error' && <p className="state-message state-message--error">저장에 실패했습니다. 다시 시도해주세요.</p>}
    </div>
  );
}
