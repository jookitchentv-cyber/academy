import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function StudentHome() {
  const { session, logout } = useAuth();

  return (
    <div className="page">
      <div className="page-header">
        <h1>{session?.name ?? '학생'}님</h1>
        <button className="logout-button" onClick={logout}>
          로그아웃
        </button>
      </div>
      <ul className="menu-list">
        <li>
          <Link to="/student/daily">일상 공부</Link>
        </li>
        <li>
          <Link to="/student/exam">시험 대비</Link>
        </li>
      </ul>
    </div>
  );
}
