import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { listStudents } from '../../services/studentsService';
import { saveAnnouncement, removeAnnouncement } from '../../services/announcementsService';
import { todayString } from '../../utils/date';
import Loading from '../../components/common/Loading';
import ErrorMessage from '../../components/common/ErrorMessage';

const TYPES = [
  { value: 'cancel', label: '휴강' },
  { value: 'time_change', label: '수업시간변경' },
  { value: 'remove', label: '공지해제' },
];

export default function AnnouncementForm() {
  const { session } = useAuth();
  const navigate = useNavigate();

  const [students, setStudents] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [date, setDate] = useState(todayString());
  const [type, setType] = useState('cancel');
  const [note, setNote] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [status, setStatus] = useState('idle');

  const isRemove = type === 'remove';

  useEffect(() => {
    listStudents()
      .then(setStudents)
      .catch(() => setLoadError('학생 목록을 불러오지 못했습니다.'));
  }, []);

  function toggleStudent(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleSave() {
    if (!date || !students) return;
    setStatus('saving');
    try {
      if (isRemove) {
        // 선택 없으면 전체 삭제, 선택 있으면 해당 학생만 제거
        const studentIdsToRemove =
          selected.size > 0 ? [...selected] : [];
        await removeAnnouncement(session.teacherId, date, studentIdsToRemove);
      } else {
        const targetStudentIds =
          selected.size > 0 ? [...selected] : students.map((s) => s.studentId);
        await saveAnnouncement(session.teacherId, { date, type, note, targetStudentIds });
      }
      navigate('/teacher');
    } catch {
      setStatus('error');
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <Link to="/teacher" className="back-link">← 뒤로</Link>
        <h1>공지 등록</h1>
        <span />
      </div>

      {loadError && <ErrorMessage>{loadError}</ErrorMessage>}

      <div className="announce-form">
        <div className="announce-field">
          <label className="announce-label">날짜</label>
          <input
            type="date"
            className="announce-date-input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div className="announce-field">
          <label className="announce-label">유형</label>
          <div className="announce-type-row">
            {TYPES.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`subject-chip ${type === opt.value ? 'subject-chip--active' : ''}`}
                style={opt.value === 'remove' && type === 'remove' ? { background: 'var(--danger)', borderColor: 'var(--danger)' } : {}}
                onClick={() => { setType(opt.value); setNote(''); }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {!isRemove && (
          <div className="announce-field">
            <label className="announce-label">메모 <span className="hint" style={{ margin: 0 }}>(선택)</span></label>
            <textarea
              className="study-input"
              style={{ minHeight: 80 }}
              placeholder="추가 안내 사항을 입력하세요"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        )}

        <div className="announce-field">
          <label className="announce-label">
            {isRemove ? '해제할 학생' : '적용 학생'}{' '}
            <span className="hint" style={{ margin: 0 }}>
              {isRemove ? '(선택 없으면 전체 해제)' : '(선택 없으면 전체 적용)'}
            </span>
          </label>
          {!students && !loadError && <Loading />}
          {students && (
            <div className="announce-student-grid">
              {students.map((s) => (
                <label key={s.studentId} className="announce-student-chip">
                  <input
                    type="checkbox"
                    checked={selected.has(s.studentId)}
                    onChange={() => toggleStudent(s.studentId)}
                  />
                  <span>
                    {s.name}
                    {s.grade && <span className="announce-student-grade">({s.grade})</span>}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        <button
          className="primary-button"
          onClick={handleSave}
          disabled={status === 'saving' || !date}
          style={isRemove ? { background: 'var(--danger)' } : {}}
        >
          {status === 'saving' ? '처리 중...' : isRemove ? '공지 해제' : '등록'}
        </button>
        {status === 'error' && (
          <p className="state-message state-message--error">처리에 실패했습니다. 다시 시도해주세요.</p>
        )}
      </div>
    </div>
  );
}
