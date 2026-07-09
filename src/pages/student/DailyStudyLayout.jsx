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
        <NavLink to="plan" className={({ isActive }) => (isActive ? 'active' : '')}>
          금일 학습 계획
        </NavLink>
        <NavLink to="actual" className={({ isActive }) => (isActive ? 'active' : '')}>
          금일 학습량
        </NavLink>
        <NavLink to="review" className={({ isActive }) => (isActive ? 'active' : '')}>
          점검
        </NavLink>
      </nav>
      <Outlet />
    </div>
  );
}
