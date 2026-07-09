import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { saveStudentEntry, saveStudentPlan } from '../../services/dailyLogsService';
import { todayString } from '../../utils/date';

const CONFIG = {
  plan: {
    save: saveStudentPlan,
    placeholder: '오늘 계획한 학습 내용을 적어주세요. 예: 수학 쎈 53페이지부터 100페이지까지 풀 예정이다.',
    savedMessage: '오늘 계획이 저장되었습니다.',
  },
  actual: {
    save: saveStudentEntry,
    placeholder: '오늘 실제로 공부한 내용을 적어주세요. 예: 수학 쎈 53페이지부터 100페이지까지 풀었다.',
    savedMessage: '오늘 학습량이 저장되었습니다.',
  },
};

// "금일 학습 계획"과 "금일 학습량"은 같은 입력 UI를 쓰지만 서로 다른 데이터로
// 저장된다(mode에 따라 다른 서비스 함수 호출) — 계획은 채점 대상이 아닌 참고용,
// 학습량은 선생님이 채점하는 실제 기록.
export default function StudyTextInput({ mode }) {
  const { session } = useAuth();
  const [text, setText] = useState('');
  const [status, setStatus] = useState('idle'); // idle | saving | saved | error
  const { save, placeholder, savedMessage } = CONFIG[mode];

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
