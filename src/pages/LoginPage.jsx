import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginStudent, loginTeacher, loginParent } from '../services/authService';

const ROLE_HOME = { student: '/student', teacher: '/teacher', parent: '/parent' };
const ROLE_LABEL = { student: '학생', parent: '학부모', teacher: '선생님' };

export default function LoginPage() {
  const [role, setRole] = useState(null); // null | 'student' | 'parent' | 'teacher'
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  function chooseRole(nextRole) {
    setRole(nextRole);
    setName('');
    setCode('');
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let result;
      if (role === 'student') result = await loginStudent(name, code);
      else if (role === 'parent') result = await loginParent(name, code);
      else result = await loginTeacher(code);

      if (!result) {
        setError(role === 'teacher' ? '코드가 일치하지 않습니다.' : '이름 또는 코드가 일치하지 않습니다.');
        return;
      }
      login(result);
      navigate(ROLE_HOME[result.role], { replace: true });
    } catch {
      setError('로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  }

  const needsName = role === 'student' || role === 'parent';

  return (
    <div className="page">
      <div className="page-header">
        <h1>화랑</h1>
      </div>

      {role === null && (
        <ul className="menu-list">
          <li>
            <button type="button" onClick={() => chooseRole('student')}>
              학생으로 로그인
            </button>
          </li>
          <li>
            <button type="button" onClick={() => chooseRole('parent')}>
              학부모로 로그인
            </button>
          </li>
          <li>
            <button type="button" onClick={() => chooseRole('teacher')}>
              선생님으로 로그인
            </button>
          </li>
        </ul>
      )}

      {role !== null && (
        <form className="login-form" onSubmit={handleSubmit}>
          <button
            type="button"
            className="back-link"
            style={{ alignSelf: 'flex-start', border: 'none', background: 'none', padding: 0 }}
            onClick={() => chooseRole(null)}
          >
            ← 뒤로
          </button>

          {needsName && (
            <input
              type="text"
              placeholder={`${ROLE_LABEL[role]} 이름`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          )}
          <input
            type="password"
            inputMode="numeric"
            placeholder="코드"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            autoFocus={role === 'teacher'}
          />
          <button
            type="submit"
            className="primary-button"
            disabled={loading || !code.trim() || (needsName && !name.trim())}
          >
            {loading ? '확인 중...' : '로그인'}
          </button>
          {error && <p className="state-message state-message--error">{error}</p>}
        </form>
      )}
    </div>
  );
}
