import { useState } from 'react';
import { createStudent, isCodeTaken, isParentCodeTaken } from '../../services/studentsService';

const GRADES = ['중1', '중2', '중3', '고1', '고2', '고3'];

export default function StudentFormModal({ onClose }) {
  const [name, setName] = useState('');
  const [grade, setGrade] = useState('');
  const [code, setCode] = useState('');
  const [parentCode, setParentCode] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState('idle');

  const canSave = name.trim() && grade && code.length === 4 && parentCode.length === 4;

  async function handleSave() {
    if (!canSave) return;
    setStatus('checking');
    try {
      const [taken, parentTaken] = await Promise.all([
        isCodeTaken(code),
        isParentCodeTaken(parentCode),
      ]);
      if (taken) { setStatus('code_taken'); return; }
      if (parentTaken) { setStatus('parent_code_taken'); return; }
      setStatus('saving');
      await createStudent({ name: name.trim(), grade, code, parentCode, phone: phone.trim() });
      onClose();
    } catch {
      setStatus('error');
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">학생 등록</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="announce-form">
          <div className="announce-field">
            <label className="announce-label">이름</label>
            <input
              type="text"
              className="announce-date-input"
              placeholder="학생 이름"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="announce-field">
            <label className="announce-label">학년</label>
            <div className="announce-type-row" style={{ flexWrap: 'wrap' }}>
              {GRADES.map((g) => (
                <button
                  key={g}
                  type="button"
                  className={`subject-chip ${grade === g ? 'subject-chip--active' : ''}`}
                  onClick={() => setGrade(g)}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div className="announce-field">
            <label className="announce-label">학생 PIN (숫자 4자리)</label>
            <input
              type="text"
              inputMode="numeric"
              className="announce-date-input"
              placeholder="0000"
              maxLength={4}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              style={{ letterSpacing: 8, textAlign: 'center', fontSize: 22 }}
            />
          </div>

          <div className="announce-field">
            <label className="announce-label">학부모 PIN (숫자 4자리)</label>
            <input
              type="text"
              inputMode="numeric"
              className="announce-date-input"
              placeholder="0000"
              maxLength={4}
              value={parentCode}
              onChange={(e) => setParentCode(e.target.value.replace(/\D/g, ''))}
              style={{ letterSpacing: 8, textAlign: 'center', fontSize: 22 }}
            />
          </div>

          <div className="announce-field">
            <label className="announce-label">
              학부모 연락처 <span className="hint" style={{ margin: 0 }}>(선택)</span>
            </label>
            <input
              type="tel"
              className="announce-date-input"
              placeholder="01012345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className="primary-button"
              onClick={handleSave}
              disabled={!canSave || status === 'saving' || status === 'checking'}
              style={{ flex: 1 }}
            >
              {status === 'saving' || status === 'checking' ? '처리 중...' : '등록'}
            </button>
            <button className="logout-button" onClick={onClose}>취소</button>
          </div>

          {status === 'code_taken' && (
            <p className="state-message state-message--error">이 학생 PIN은 이미 사용 중입니다.</p>
          )}
          {status === 'parent_code_taken' && (
            <p className="state-message state-message--error">이 학부모 PIN은 이미 사용 중입니다.</p>
          )}
          {status === 'error' && (
            <p className="state-message state-message--error">저장에 실패했습니다. 다시 시도해주세요.</p>
          )}
        </div>
      </div>
    </div>
  );
}
