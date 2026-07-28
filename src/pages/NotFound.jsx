import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="page">
      <p className="state-message">페이지를 찾을 수 없습니다.</p>
      <Link to="/" className="back-link">
        로그인으로 돌아가기
      </Link>
    </div>
  );
}
