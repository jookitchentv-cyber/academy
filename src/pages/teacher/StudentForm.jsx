import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getStudent, createStudent, updateStudent, deleteStudent, isCodeTaken, isParentCodeTaken } from '../../services/studentsService';
import Loading from '../../components/common/Loading';

const GRADES = ['중1', '중2', '중3', '고1', '고2', '고3'];

export default function StudentForm() {
  const { studentId } = useParams();
  const isEdit = Boolean(studentId);
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [grade, setGrade] = useState('');
  const [code, setCode] = useState('');
  const [parentCode, setParentCode] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(isEdit);
  const [status, setStatus] = useState('idle');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    getStudent(studentId).then((s) => {
      if (s) {
        setName(s.name ?? '');
        setGrade(s.grade ?? '');
        setCode(s.code ?? '');
        setParentCode(s.parentCode ?? '');
        setPhone(s.phone ?? '');
      }
      setLoading(false);
    });
  }, [studentId, isEdit]);

  const canSave = name.trim() && grade && code.length === 4 && parentCode.length === 4;

  async function handleSave() {
    if (!canSave) return;
    setStatus('checking');
    try {
      const exclude = isEdit ? studentId : null;
      const [taken, parentTaken] = await Promise.all([
        isCodeTaken(code, exclude),
        isParentCodeTaken(parentCode, exclude),
      ]);
      if (taken) { setStatus('code_taken'); return; }
      if (parentTaken) { setStatus('parent_code_taken'); return; }
      setStatus('saving');
      if (isEdit) {
        await updateStudent(studentId, { name: name.trim(), grade, code, parentCode, phone: phone.trim() });
      } else {
        await createStudent({ name: name.trim(), grade, code, parentCode, phone: phone.trim() });
      }
      navigate('/teacher');
    } catch (e) {
      console.error('StudentForm save error:', e);
      setStatus('error');
    }
  }

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setStatus('saving');
    try {
      await deleteStudent(studentId);
      navigate('/teacher');
    } catch {
      setStatus('error');
    }
  }

  if (loading) return <Loading />;

  return (
    <div className="page">
      <div className="page-header">
        <Link to="/teacher" className="back-link">← 뒤로</Link>
        <h1>{isEdit ? '학생 수정' : '학생 등록'}</h1>
        <span />
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
          <label className="announce-label">학부모 연락처 <span className="hint" style={{ margin: 0 }}>(선택)</span></label>
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
            disabled={status === 'saving' || !canSave}
            style={{ flex: 1 }}
          >
            {status === 'saving' ? '저장 중...' : isEdit ? '저장' : '등록'}
          </button>
          <Link to="/teacher" className="logout-button" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            취소
          </Link>
        </div>

        {isEdit && (
          <div style={{ marginTop: 8, borderTop: '1px solid var(--border)', paddingTop: 20 }}>
            <button
              className="logout-button"
              style={{ color: 'var(--danger)', borderColor: 'var(--danger)', width: '100%' }}
              onClick={handleDelete}
              disabled={status === 'saving'}
            >
              {confirmDelete ? '정말 삭제하시겠습니까? 한 번 더 누르면 삭제됩니다' : '학생 삭제'}
            </button>
          </div>
        )}

        {status === 'code_taken' && (
          <p className="state-message state-message--error">이 학생 PIN은 이미 사용 중입니다. 다른 번호를 입력해주세요.</p>
        )}
        {status === 'parent_code_taken' && (
          <p className="state-message state-message--error">이 학부모 PIN은 이미 사용 중입니다. 다른 번호를 입력해주세요.</p>
        )}
        {status === 'error' && (
          <p className="state-message state-message--error">저장에 실패했습니다. 다시 시도해주세요.</p>
        )}
      </div>
    </div>
  );
}
