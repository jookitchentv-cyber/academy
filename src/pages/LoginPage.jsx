import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginStudent, loginTeacher, loginParent } from '../services/authService';
import bgLogin from '../assets/bg-login.png';
import btnStudent from '../assets/btn-student.png';
import btnParent from '../assets/btn-parent.png';
import btnTeacher from '../assets/btn-teacher.png';
import iconBlog from '../assets/icon-blog.png';

const ROLE_HOME = { student: '/student', teacher: '/teacher', parent: '/parent' };
const NAME_PLACEHOLDER = { student: '학생 이름', parent: '자녀 이름' };
const ROLE_LABEL = { student: '학생 로그인', parent: '학부모 로그인', teacher: '선생님 로그인' };

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

  function closePopup() {
    setRole(null);
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
    <div className="page login-bg-page" style={{ backgroundImage: `url(${bgLogin})`, backgroundSize: 'cover', backgroundPosition: 'top center', backgroundRepeat: 'no-repeat' }}>

      <div className="login-role-list">
        <button type="button" className="login-img-btn" onClick={() => chooseRole('student')}>
          <img src={btnStudent} alt="학생으로 로그인" />
        </button>
        <button type="button" className="login-img-btn" onClick={() => chooseRole('parent')}>
          <img src={btnParent} alt="학부모로 로그인" />
        </button>
        <button type="button" className="login-img-btn" onClick={() => chooseRole('teacher')}>
          <img src={btnTeacher} alt="선생님으로 로그인" />
        </button>
      </div>

      <div className="login-social login-social--a">
        <a href="https://www.youtube.com/@HwarangMT" target="_blank" rel="noopener noreferrer" className="login-social__btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#ff0000"><path d="M23.5 6.2s-.2-1.6-1-2.3c-.9-1-1.9-1-2.4-1C17.1 2.8 12 2.8 12 2.8s-5.1 0-8.1.1c-.5.1-1.5.1-2.4 1C.7 4.6.5 6.2.5 6.2S.3 8 .3 9.9v1.8c0 1.8.2 3.7.2 3.7s.2 1.6 1 2.3c.9 1 2.1.9 2.6 1C5.6 18.9 12 19 12 19s5.1 0 8.1-.2c.5-.1 1.5-.1 2.4-1 .8-.7 1-2.3 1-2.3s.2-1.8.2-3.7V9.9c0-1.9-.2-3.7-.2-3.7zM9.7 14.5V8.4l6.6 3.1-6.6 3z"/></svg>
          유튜브
        </a>
        <a href="https://blog.naver.com/ojs_lovehouse" target="_blank" rel="noopener noreferrer" className="login-social__btn">
          <img src={iconBlog} alt="블로그" width="18" height="18" style={{ borderRadius: 4 }} />
          블로그
        </a>
      </div>

      {role !== null && (
        <div
          onClick={closePopup}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: '#fff', borderRadius: 16, padding: '28px 24px', width: '85%', maxWidth: 340 }}
          >
            <h2 style={{ margin: '0 0 20px', fontSize: 18, textAlign: 'center' }}>{ROLE_LABEL[role]}</h2>
            <form style={{ display: 'flex', flexDirection: 'column', gap: 12 }} onSubmit={handleSubmit}>
              {needsName && (
                <input
                  type="text"
                  placeholder={NAME_PLACEHOLDER[role]}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                  style={{ padding: 12, fontSize: 16, borderRadius: 10, border: '1px solid #ddd', textAlign: 'center' }}
                />
              )}
              <input
                type="password"
                inputMode="numeric"
                placeholder="코드"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                autoFocus={role === 'teacher'}
                style={{ padding: 12, fontSize: 16, borderRadius: 10, border: '1px solid #ddd', textAlign: 'center', letterSpacing: 4 }}
              />
              <button
                type="submit"
                className="primary-button"
                disabled={loading || !code.trim() || (needsName && !name.trim())}
              >
                {loading ? '확인 중...' : '로그인'}
              </button>
              {error && <p className="state-message state-message--error" style={{ textAlign: 'center', margin: 0 }}>{error}</p>}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
