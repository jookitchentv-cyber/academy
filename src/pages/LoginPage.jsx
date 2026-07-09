import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginWithCode } from '../services/authService';

export default function LoginPage() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await loginWithCode(code);
      if (!result) {
        setError('일치하는 코드를 찾을 수 없습니다.');
        return;
      }
      login(result);
      navigate(result.role === 'student' ? '/student' : '/teacher', { replace: true });
    } catch {
      setError('로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>화랑</h1>
      </div>
      <form className="login-form" onSubmit={handleSubmit}>
        <input
          type="text"
          inputMode="numeric"
          placeholder="코드 입력"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          autoFocus
        />
        <button type="submit" className="primary-button" disabled={loading || !code.trim()}>
          {loading ? '확인 중...' : '로그인'}
        </button>
        {error && <p className="state-message state-message--error">{error}</p>}
      </form>
    </div>
  );
}
