import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getStudent } from '../../services/studentsService';
import Loading from '../../components/common/Loading';

export default function StudentMenu() {
  const { studentId } = useParams();
  const [student, setStudent] = useState(undefined);

  useEffect(() => {
    let cancelled = false;
    getStudent(studentId).then((data) => {
      if (!cancelled) setStudent(data);
    });
    return () => { cancelled = true; };
  }, [studentId]);

  return (
    <div className="page">
      <div className="page-header">
        <Link to="/teacher" className="back-link">
          ← 학생 목록
        </Link>
        <h1>{student === undefined ? <Loading label="" /> : (student?.name ?? '학생')}</h1>
        <span />
      </div>
      <ul className="menu-list">
        <li>
          <Link to={`/teacher/students/${studentId}/daily`}>일상 공부</Link>
        </li>
        <li>
          <Link to={`/teacher/students/${studentId}/exam`}>시험 대비</Link>
        </li>
        <li>
          <Link to={`/teacher/students/${studentId}/attendance`}>출석확인</Link>
        </li>
      </ul>
    </div>
  );
}
