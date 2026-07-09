import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { saveStudentEntry } from '../../services/dailyLogsService';
import { todayString } from '../../utils/date';

export default function DailyStudyInput() {
  const { session } = useAuth();
  const [text, setText] = useState('');
  const [status, setStatus] = useState('idle'); // idle | saving | saved | error

  async function handleSave() {
    if (!text.trim()) return;
    setStatus('saving');
    try {
      await saveStudentEntry(session.studentId, todayString(), text);
      setStatus('saved');
    } catch {
      setStatus('error');
    }
  }

  return (
    <div>
      <textarea
        className="study-input"
        placeholder="오늘 공부한 내용을 적어주세요. 예: 수학 쎈 53페이지부터 100페이지까지 풀었다."
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
      {status === 'saved' && <p className="state-message">오늘 기록이 저장되었습니다.</p>}
      {status === 'error' && <p className="state-message state-message--error">저장에 실패했습니다. 다시 시도해주세요.</p>}
    </div>
  );
}
