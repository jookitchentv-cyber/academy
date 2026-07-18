import { useAuth } from '../../context/AuthContext';

export default function TeacherSettings() {
  const { logout } = useAuth();

  return (
    <div className="page">
      <div className="page-header">
        <h1>설정</h1>
      </div>
      <ul className="menu-list" style={{ marginTop: 16 }}>
        <li>
          <button onClick={logout} style={{ width: '100%', textAlign: 'center' }}>로그아웃</button>
        </li>
      </ul>
    </div>
  );
}
