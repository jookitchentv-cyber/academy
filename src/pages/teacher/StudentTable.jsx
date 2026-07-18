import { useState } from 'react';
import { updateStudent, deleteStudent, updateStudentMemo } from '../../services/studentsService';
import { useTeacher } from '../../context/TeacherContext';
import StudentFormModal from './StudentFormModal';
import Loading from '../../components/common/Loading';
import ErrorMessage from '../../components/common/ErrorMessage';

const GRADES = ['중1', '중2', '중3', '고1', '고2', '고3'];

function IconTrash() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6l-1 14H6L5 6"/>
      <line x1="10" y1="11" x2="10" y2="17"/>
      <line x1="14" y1="11" x2="14" y2="17"/>
      <path d="M9 6V4h6v2"/>
    </svg>
  );
}

function IconMemo({ hasContent }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={hasContent ? 'var(--accent)' : 'var(--text-muted)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  );
}

const tdStyle = {
  padding: '13px 8px',
  borderBottom: '1px solid #e0e0e0',
  borderRight: '1px solid #e0e0e0',
  whiteSpace: 'nowrap',
};

export default function StudentTable() {
  const { students, error, refresh } = useTeacher();
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [drafts, setDrafts] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(new Set());

  const [expandedMemoId, setExpandedMemoId] = useState(null);
  const [memoDraft, setMemoDraft] = useState('');
  const [memoSaving, setMemoSaving] = useState(false);

  function toggleMemo(s) {
    if (expandedMemoId === s.studentId) {
      setExpandedMemoId(null);
    } else {
      setExpandedMemoId(s.studentId);
      setMemoDraft(s.memo ?? '');
    }
  }

  async function handleMemoSave(studentId) {
    setMemoSaving(true);
    try {
      await updateStudentMemo(studentId, memoDraft);
      refresh();
      setExpandedMemoId(null);
    } catch {
      // keep open on error
    } finally {
      setMemoSaving(false);
    }
  }

  function enterEditMode() {
    const d = {};
    students.forEach((s) => {
      d[s.studentId] = {
        name: s.name ?? '',
        grade: s.grade ?? '',
        code: s.code ?? '',
        parentCode: s.parentCode ?? '',
        phone: s.phone ?? '',
      };
    });
    setDrafts(d);
    setEditMode(true);
    setSaveError('');
  }

  function cancelEdit() {
    setEditMode(false);
    setDrafts({});
    setSaveError('');
    setDeleteConfirm(new Set());
  }

  function toggleDeleteConfirm(studentId) {
    setDeleteConfirm((prev) => {
      const next = new Set(prev);
      next.has(studentId) ? next.delete(studentId) : next.add(studentId);
      return next;
    });
  }

  async function handleDelete(studentId) {
    setSaveError('');
    try {
      await deleteStudent(studentId);
      refresh();
      setDeleteConfirm((prev) => {
        const next = new Set(prev);
        next.delete(studentId);
        return next;
      });
    } catch {
      setSaveError('삭제에 실패했습니다.');
    }
  }

  async function confirmEdit() {
    for (const s of students) {
      const d = drafts[s.studentId];
      if (!d.name.trim()) { setSaveError('이름이 빈 학생이 있습니다.'); return; }
      if (d.code.length !== 4) { setSaveError(`${d.name || '?'}의 학생 PIN은 4자리여야 합니다.`); return; }
      if (d.parentCode && d.parentCode.length !== 4) { setSaveError(`${d.name || '?'}의 학부모 PIN은 4자리여야 합니다.`); return; }
    }
    setSaving(true);
    setSaveError('');
    try {
      const changed = students.filter((s) => {
        const d = drafts[s.studentId];
        return (
          d.name !== (s.name ?? '') ||
          d.grade !== (s.grade ?? '') ||
          d.code !== (s.code ?? '') ||
          d.parentCode !== (s.parentCode ?? '') ||
          d.phone !== (s.phone ?? '')
        );
      });
      await Promise.all(changed.map((s) => updateStudent(s.studentId, drafts[s.studentId])));
      refresh();
      setEditMode(false);
      setDrafts({});
    } catch {
      setSaveError('저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSaving(false);
    }
  }

  function updateDraft(studentId, field, value) {
    setDrafts((prev) => ({ ...prev, [studentId]: { ...prev[studentId], [field]: value } }));
  }

  if (error) return <ErrorMessage>{error}</ErrorMessage>;

  const totalCols = editMode ? 8 : 7;

  return (
    <div className="page">
      <div className="page-header">
        <h1 style={{ textAlign: 'left', paddingLeft: 8, fontSize: 17, fontWeight: 600 }}>학생 현황</h1>
        <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
          {!editMode ? (
            <>
              <button className="logout-button" onClick={() => setShowModal(true)}>
                + 학생 등록
              </button>
              <button className="logout-button" onClick={enterEditMode} disabled={!students?.length}>
                수정
              </button>
            </>
          ) : (
            <>
              <button className="logout-button" onClick={cancelEdit} disabled={saving}>
                취소
              </button>
              <button
                className="primary-button"
                onClick={confirmEdit}
                disabled={saving}
                style={{ width: 'auto', minWidth: 60 }}
              >
                {saving ? '저장 중...' : '확인'}
              </button>
            </>
          )}
        </div>
      </div>

      {saveError && (
        <p className="state-message state-message--error" style={{ margin: '8px 8px 0' }}>
          {saveError}
        </p>
      )}

      {students === null ? (
        <Loading />
      ) : (
        <div style={{ overflowX: 'auto', margin: '-5px -8px 0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                {['#', '이름', '학년', '학생PIN', '부모PIN', '연락처', ''].map((h, idx) => (
                  <th
                    key={idx}
                    style={{
                      padding: '6px 8px',
                      textAlign: 'center',
                      borderTop: '2px solid #e0e0e0',
                      borderBottom: '2px solid #e0e0e0',
                      borderRight: idx < 6 ? '1px solid #e0e0e0' : 'none',
                      whiteSpace: 'nowrap',
                      fontWeight: 600,
                      width: idx === 6 ? 36 : undefined,
                    }}
                  >
                    {h}
                  </th>
                ))}
                {editMode && (
                  <th style={{ padding: '6px 8px', borderTop: '2px solid #e0e0e0', borderBottom: '2px solid #e0e0e0', width: 40 }} />
                )}
              </tr>
            </thead>
            <tbody>
              {students.map((s, i) => {
                const d = drafts[s.studentId];
                const isDeleting = deleteConfirm.has(s.studentId);
                const isMemoOpen = expandedMemoId === s.studentId;
                const hasMemo = !!s.memo;
                const rowBg = isDeleting ? '#fdecea' : editMode ? '#fffbee' : i % 2 === 0 ? '#fff' : '#fafafa';
                return (
                  <>
                    <tr key={s.studentId} style={{ background: rowBg }}>
                      <td style={{ ...tdStyle, textAlign: 'center', color: 'var(--text-muted)', fontWeight: 600 }}>
                        {students.length - i}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        {editMode ? (
                          <input
                            className="table-edit-input"
                            value={d.name}
                            onChange={(e) => updateDraft(s.studentId, 'name', e.target.value)}
                          />
                        ) : (
                          s.name
                        )}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        {editMode ? (
                          <select
                            className="table-edit-select"
                            value={d.grade}
                            onChange={(e) => updateDraft(s.studentId, 'grade', e.target.value)}
                          >
                            <option value="">-</option>
                            {GRADES.map((g) => (
                              <option key={g} value={g}>{g}</option>
                            ))}
                          </select>
                        ) : (
                          s.grade || '-'
                        )}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center', fontFamily: 'monospace' }}>
                        {editMode ? (
                          <input
                            className="table-edit-input table-edit-input--pin"
                            inputMode="numeric"
                            maxLength={4}
                            value={d.code}
                            onChange={(e) => updateDraft(s.studentId, 'code', e.target.value.replace(/\D/g, ''))}
                          />
                        ) : (
                          s.code
                        )}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center', fontFamily: 'monospace' }}>
                        {editMode ? (
                          <input
                            className="table-edit-input table-edit-input--pin"
                            inputMode="numeric"
                            maxLength={4}
                            value={d.parentCode}
                            onChange={(e) => updateDraft(s.studentId, 'parentCode', e.target.value.replace(/\D/g, ''))}
                          />
                        ) : (
                          s.parentCode || '-'
                        )}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        {editMode ? (
                          <input
                            className="table-edit-input"
                            type="tel"
                            value={d.phone}
                            onChange={(e) => updateDraft(s.studentId, 'phone', e.target.value)}
                          />
                        ) : (
                          s.phone || '-'
                        )}
                      </td>
                      <td style={{ ...tdStyle, borderRight: 'none', textAlign: 'center', padding: '4px 6px' }}>
                        <button
                          onClick={() => toggleMemo(s)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}
                          title="메모"
                        >
                          <IconMemo hasContent={hasMemo} />
                        </button>
                      </td>
                      {editMode && (
                        <td style={{ ...tdStyle, borderRight: 'none', textAlign: 'center', padding: '4px 6px' }}>
                          {isDeleting ? (
                            <button
                              onClick={() => handleDelete(s.studentId)}
                              style={{ background: 'var(--danger)', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 8px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                            >
                              확인
                            </button>
                          ) : (
                            <button
                              onClick={() => toggleDeleteConfirm(s.studentId)}
                              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}
                            >
                              <IconTrash />
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                    {isMemoOpen && (
                      <tr style={{ background: '#f0f6ff' }}>
                        <td colSpan={totalCols} style={{ padding: '10px 12px', borderBottom: '1px solid #e0e0e0' }}>
                          <textarea
                            className="study-input"
                            style={{ minHeight: 72, fontSize: 13, marginBottom: 8 }}
                            placeholder="학생에 대한 메모를 입력하세요"
                            value={memoDraft}
                            onChange={(e) => setMemoDraft(e.target.value)}
                          />
                          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                            <button
                              className="logout-button"
                              onClick={() => setExpandedMemoId(null)}
                              style={{ fontSize: 12 }}
                            >
                              취소
                            </button>
                            <button
                              className="primary-button"
                              onClick={() => handleMemoSave(s.studentId)}
                              disabled={memoSaving}
                              style={{ width: 'auto', minWidth: 56, fontSize: 12 }}
                            >
                              {memoSaving ? '저장 중...' : '저장'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
          {students.length === 0 && (
            <p style={{ textAlign: 'center', color: '#999', marginTop: 32 }}>
              등록된 학생이 없습니다.
            </p>
          )}
        </div>
      )}
      {showModal && <StudentFormModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
