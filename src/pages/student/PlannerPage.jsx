import { useAuth } from '../../context/AuthContext';
import PlannerCalendar from '../../components/planner/PlannerCalendar';

export default function StudentPlannerPage() {
  const { session } = useAuth();
  return (
    <div className="page">
      <div className="page-header">
        <h1>플래너</h1>
      </div>
      <PlannerCalendar studentId={session.studentId} />
    </div>
  );
}
