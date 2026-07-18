import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTeacher } from '../../context/TeacherContext';
import {
  listAnnouncementsForTeacher,
  saveAnnouncement,
  removeAnnouncement,
  buildAnnouncementMap,
} from '../../services/announcementsService';
import { formatDateLabel } from '../../utils/date';
import MonthCalendar from '../../components/calendar/MonthCalendar';
import Loading from '../../components/common/Loading';

const today = new Date();

const TYPES = [
  { value: 'cancel', label: '휴강' },
  { value: 'time_change', label: '시간변경' },
];

export default function AnnouncementForm() {
  const { session } = useAuth();
  const { students } = useTeacher();
  const navigate = useNavigate();

  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [allAnnouncements, setAllAnnouncements] = useState(null);

  // 팝업 상태
  const [selectedDate, setSelectedDate] = useState(null);
  const [type, setType] = useState('cancel');
  const [note, setNote] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [saveStatus, setSaveStatus] = useState('idle');

  useEffect(() => {
    listAnnouncementsForTeacher(session.teacherId).then(setAllAnnouncements);
  }, [session.teacherId]);

  const announcementsByDate = allAnnouncements ? buildAnnouncementMap(allAnnouncements) : new Map();

  function prevMonth() {
    if (month === 1) { setYear((y) => y - 1); setMonth(12); }
    else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 12) { setYear((y) => y + 1); setMonth(1); }
    else setMonth((m) => m + 1);
  }

  function handleDayClick(date) {
    const existing = announcementsByDate.get(date);
    setSelectedDate(date);
    setType(existing?.type ?? 'cancel');
    setNote(existing?.note ?? '');
    setSelected(new Set(existing?.targetStudentIds ?? []));
    setSaveStatus('idle');
  }

  function closePopup() {
    setSelectedDate(null);
    setSaveStatus('idle');
  }

  function toggleStudent(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleSave() {
    setSaveStatus('saving');
    try {
      const targetStudentIds =
        selected.size > 0 ? [...selected] : (students?.map((s) => s.studentId) ?? []);
      await saveAnnouncement(session.teacherId, { date: selectedDate, type, note, targetStudentIds });
      setAllAnnouncements((prev) => [
        ...(prev ?? []).filter((a) => a.date !== selectedDate),
        { date: selectedDate, type, note: note || '', targetStudentIds },
      ]);
      closePopup();
    } catch {
      setSaveStatus('error');
    }
  }

  async function handleRemove() {
    setSaveStatus('saving');
    try {
      await removeAnnouncement(session.teacherId, selectedDate, []);
      setAllAnnouncements((prev) => (prev ?? []).filter((a) => a.date !== selectedDate));
      closePopup();
    } catch {
      setSaveStatus('error');
    }
  }

  const existing = selectedDate ? announcementsByDate.get(selectedDate) : null;

  return (
    <div className="page">
      <div className="page-header">
        <h1>공지 등록</h1>
      </div>

      {allAnnouncements === null ? (
        <Loading />
      ) : (
        <MonthCalendar
          year={year}
          month={month}
          statusByDate={new Map()}
          announcementsByDate={announcementsByDate}
          onDayClick={handleDayClick}
          onPrev={prevMonth}
          onNext={nextMonth}
        />
      )}

      {selectedDate && (
        <div className="modal-overlay" onClick={closePopup}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title" style={{ textAlign: 'center', flex: 1 }}>{formatDateLabel(selectedDate)}</h2>
              <button className="modal-close" onClick={closePopup}>✕</button>
            </div>

            {existing && (
              <div className={`today-announce today-announce--${existing.type}`} style={{ marginBottom: 16 }}>
                현재: {existing.type === 'cancel' ? '휴강' : '수업시간변경'}
                {existing.note ? ` — ${existing.note}` : ''}
              </div>
            )}

            <div className="announce-form">
              <div className="announce-field">
                <label className="announce-label">유형</label>
                <div className="announce-type-row">
                  {TYPES.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`subject-chip ${type === opt.value ? 'subject-chip--active' : ''}`}
                      onClick={() => setType(opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="announce-field">
                <label className="announce-label">
                  메모 <span className="hint" style={{ margin: 0 }}>(선택)</span>
                </label>
                <textarea
                  className="study-input"
                  style={{ minHeight: 70 }}
                  placeholder="추가 안내 사항을 입력하세요"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>

              <div className="announce-field">
                <label className="announce-label">
                  적용 학생{' '}
                  <span className="hint" style={{ margin: 0 }}>(선택 없으면 전체)</span>
                </label>
                <div className="announce-student-grid">
                  {students?.map((s) => (
                    <label key={s.studentId} className="announce-student-chip">
                      <input
                        type="checkbox"
                        checked={selected.has(s.studentId)}
                        onChange={() => toggleStudent(s.studentId)}
                      />
                      <span>
                        {s.name}
                        {s.grade && (
                          <span className="announce-student-grade"> ({s.grade})</span>
                        )}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="primary-button"
                  onClick={handleSave}
                  disabled={saveStatus === 'saving'}
                  style={{ flex: 1 }}
                >
                  {saveStatus === 'saving' ? '저장 중...' : existing ? '수정' : '등록'}
                </button>
                {existing && (
                  <button
                    className="logout-button"
                    onClick={handleRemove}
                    disabled={saveStatus === 'saving'}
                    style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
                  >
                    해제
                  </button>
                )}
              </div>

              {saveStatus === 'error' && (
                <p className="state-message state-message--error">
                  처리에 실패했습니다. 다시 시도해주세요.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
