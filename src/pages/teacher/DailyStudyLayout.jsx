import { Link, Outlet, useParams } from 'react-router-dom';

// 학생의 DailyStudyLayout과 달리 "입력하기" 탭이 없다 — 선생님은 원문을 쓰지 않고
// 확인/채점만 하므로 학생용 레이아웃을 그대로 재사용하지 않고 별도 컴포넌트로 둔다.
export default function DailyStudyLayout() {
  const { studentId } = useParams();

  return (
    <div className="page">
      <div className="page-header">
        <Link to={`/teacher/students/${studentId}`} className="back-link">
          ← 뒤로
        </Link>
        <h1 style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', margin: 0 }}>일상 공부</h1>
        <span />
      </div>
      <Outlet />
    </div>
  );
}
