import { Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ParentLayout() {
  const { session, logout } = useAuth();

  return (
    <div className="page">
      <div className="page-header">
        <h1>{session?.name ?? '자녀'} 학습 점검</h1>
        <button className="logout-button" onClick={logout}>
          로그아웃
        </button>
      </div>
      <Outlet />
    </div>
  );
}
