import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginStudent, loginTeacher, loginParent } from '../services/authService';
import bookDeco from '../assets/book-deco.png';
import logo from '../assets/logo.png';
import iconStudent from '../assets/icon-student.png';
import iconParent from '../assets/icon-parent.png';
import iconTeacher from '../assets/icon-teacher.png';

const ROLE_HOME = { student: '/student', teacher: '/teacher', parent: '/parent' };
const NAME_PLACEHOLDER = { student: '학생 이름', parent: '자녀 이름' };

function PersonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="white" width="22" height="22" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-3.5 3.6-6 8-6s8 2.5 8 6" />
    </svg>
  );
}

export default function LoginPage() {
  const [role, setRole] = useState(null);
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
      {role === null && (
        <>
          <div className="login-hero">
            <div>
              <img src={logo} alt="화랑" className="login-logo" />

            </div>
            <img src={bookDeco} alt="" aria-hidden="true" className="login-deco-img" />
          </div>

          <ul className="menu-list login-role-list">
            <li>
              <button type="button" onClick={() => chooseRole('student')}>
                <span className="role-icon-box role-icon-box--student">
                  <img src={iconStudent} alt="" className="role-icon-img" />
                </span>
                <span className="role-text">
                  <span className="role-title">학생으로 로그인</span>
                </span>
                <span className="role-chevron">›</span>
              </button>
            </li>
            <li>
              <button type="button" onClick={() => chooseRole('parent')}>
                <span className="role-icon-box role-icon-box--parent">
                  <img src={iconParent} alt="" className="role-icon-img" />
                </span>
                <span className="role-text">
                  <span className="role-title">학부모로 로그인</span>
                </span>
                <span className="role-chevron">›</span>
              </button>
            </li>
            <li>
              <button type="button" onClick={() => chooseRole('teacher')}>
                <span className="role-icon-box role-icon-box--teacher">
                  <img src={iconTeacher} alt="" className="role-icon-img" />
                </span>
                <span className="role-text">
                  <span className="role-title">선생님으로 로그인</span>
                </span>
                <span className="role-chevron">›</span>
              </button>
            </li>
          </ul>
        </>
      )}

      {role !== null && (
        <>
          <div className="login-hero">
            <div>
              <img src={logo} alt="화랑" className="login-logo" />

            </div>
          </div>

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
                placeholder={NAME_PLACEHOLDER[role]}
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
        </>
      )}
    </div>
  );
}
