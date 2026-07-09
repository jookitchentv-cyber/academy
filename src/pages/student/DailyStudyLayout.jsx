import { NavLink, Outlet, Link } from 'react-router-dom';

export default function DailyStudyLayout() {
  return (
    <div className="page">
      <div className="page-header">
        <Link to="/student" className="back-link">
          ← 뒤로
        </Link>
        <h1>일상 공부</h1>
        <span />
      </div>
      <nav className="tabs">
        <NavLink to="input" className={({ isActive }) => (isActive ? 'active' : '')}>
          학습상태 입력하기
        </NavLink>
        <NavLink to="history" className={({ isActive }) => (isActive ? 'active' : '')}>
          학습상태 확인하기
        </NavLink>
      </nav>
      <Outlet />
    </div>
  );
}
