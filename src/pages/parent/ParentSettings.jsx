import { useAuth } from '../../context/AuthContext';

export default function ParentSettings() {
  const { session, logout } = useAuth();

  return (
    <div className="page">
      <div className="page-header">
        <h1>설정</h1>
      </div>
      <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: 15, margin: 0 }}>
          {session?.name ?? '자녀'} 학부모님으로 로그인 중
        </p>
        <button className="logout-button" onClick={logout} style={{ width: '100%', textAlign: 'center' }}>
          로그아웃
        </button>
      </div>
    </div>
  );
}
