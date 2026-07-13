import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getStudent } from '../../services/studentsService';
import { getParentByStudentId, updateParentPhone } from '../../services/parentsService';
import Loading from '../../components/common/Loading';

export default function StudentMenu() {
  const { studentId } = useParams();
  const [student, setStudent] = useState(undefined);
  const [parent, setParent] = useState(undefined); // undefined=로딩중, null=없음
  const [editing, setEditing] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [saveStatus, setSaveStatus] = useState('idle'); // idle | saving | saved | error

  useEffect(() => {
    let cancelled = false;
    getStudent(studentId).then((data) => {
      if (!cancelled) setStudent(data);
    });
    getParentByStudentId(studentId).then((data) => {
      if (!cancelled) setParent(data);
    }).catch(() => {
      if (!cancelled) setParent(null);
    });
    return () => { cancelled = true; };
  }, [studentId]);

  function startEdit() {
    setPhoneInput(parent?.phone ?? '');
    setSaveStatus('idle');
    setEditing(true);
  }

  async function handleSave() {
    if (!parent) return;
    setSaveStatus('saving');
    try {
      await updateParentPhone(parent.parentId, phoneInput);
      setParent((prev) => ({ ...prev, phone: phoneInput.trim() || null }));
      setSaveStatus('saved');
      setEditing(false);
    } catch {
      setSaveStatus('error');
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <Link to="/teacher" className="back-link">
          ← 학생 목록
        </Link>
        <h1>{student === undefined ? <Loading label="" /> : (student?.name ?? '학생')}</h1>
        <span />
      </div>
      <ul className="menu-list">
        <li>
          <Link to={`/teacher/students/${studentId}/daily`}>일상 공부</Link>
        </li>
        <li>
          <Link to={`/teacher/students/${studentId}/exam`}>시험 대비</Link>
        </li>
        <li>
          <Link to={`/teacher/students/${studentId}/attendance`}>출석확인</Link>
        </li>
      </ul>

      <div className="parent-contact">
        <p className="parent-contact__label">학부모 연락처</p>
        {parent === undefined && <p className="state-message">불러오는 중...</p>}
        {parent === null && <p className="state-message state-message--muted">학부모 계정이 없습니다.</p>}
        {parent !== null && parent !== undefined && !editing && (
          <div className="parent-contact__row">
            <span className="parent-contact__phone">
              {parent.phone ?? '번호 미등록'}
            </span>
            <button className="button-secondary" onClick={startEdit}>
              {parent.phone ? '수정' : '등록'}
            </button>
          </div>
        )}
        {parent !== null && parent !== undefined && editing && (
          <div className="parent-contact__edit">
            <input
              type="tel"
              className="parent-contact__input"
              placeholder="01012345678"
              value={phoneInput}
              onChange={(e) => { setPhoneInput(e.target.value); setSaveStatus('idle'); }}
            />
            <div className="parent-contact__actions">
              <button className="primary-button" onClick={handleSave} disabled={saveStatus === 'saving'}>
                {saveStatus === 'saving' ? '저장 중...' : '저장'}
              </button>
              <button className="button-secondary" onClick={() => setEditing(false)} disabled={saveStatus === 'saving'}>
                취소
              </button>
            </div>
            {saveStatus === 'error' && <p className="state-message state-message--error">저장에 실패했습니다.</p>}
          </div>
        )}
      </div>
    </div>
  );
}
