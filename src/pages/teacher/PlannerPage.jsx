import { Link, useParams } from 'react-router-dom';
import { useTeacher } from '../../context/TeacherContext';
import PlannerCalendar from '../../components/planner/PlannerCalendar';

export default function TeacherPlannerPage() {
  const { studentId } = useParams();
  const { students } = useTeacher();
  const student = students?.find(s => s.studentId === studentId);

  return (
    <div className="page">
      <div className="page-header">
        <Link to="/teacher" className="back-link">← 뒤로</Link>
        <h1>{student?.name ?? ''} 플래너</h1>
        <span />
      </div>
      <PlannerCalendar studentId={studentId} />
    </div>
  );
}
