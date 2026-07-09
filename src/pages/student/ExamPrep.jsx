import { Link, useLocation, useParams } from 'react-router-dom';

// 학생/선생님 화면에서 공통으로 쓰는 "시험 대비" 스켈레톤. 시험 기간에 상세 기능 추가 예정.
export default function ExamPrep() {
  const location = useLocation();
  const { studentId } = useParams();
  const isTeacherContext = location.pathname.startsWith('/teacher');
  const backTo = isTeacherContext ? `/teacher/students/${studentId}` : '/student';

  return (
    <div className="page">
      <div className="page-header">
        <Link to={backTo} className="back-link">
          ← 뒤로
        </Link>
        <h1>시험 대비</h1>
        <span />
      </div>
      <p className="state-message state-message--muted">준비중입니다. 시험 기간에 추가될 예정이에요.</p>
    </div>
  );
}
