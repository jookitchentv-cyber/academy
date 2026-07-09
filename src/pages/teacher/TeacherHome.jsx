import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { listStudents } from '../../services/studentsService';
import Loading from '../../components/common/Loading';
import EmptyState from '../../components/common/EmptyState';
import ErrorMessage from '../../components/common/ErrorMessage';

export default function TeacherHome() {
  const { logout } = useAuth();
  const [students, setStudents] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    listStudents()
      .then((data) => {
        if (!cancelled) setStudents(data);
      })
      .catch(() => {
        if (!cancelled) setError('학생 목록을 불러오지 못했습니다.');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="page">
      <div className="page-header">
        <h1>담당 학생</h1>
        <button className="logout-button" onClick={logout}>
          로그아웃
        </button>
      </div>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {!error && students === null && <Loading />}
      {!error && students?.length === 0 && <EmptyState label="등록된 학생이 없습니다." />}
      {!error && students?.length > 0 && (
        <ul className="menu-list">
          {students.map((s) => (
            <li key={s.studentId}>
              <Link to={`/teacher/students/${s.studentId}`}>{s.name}</Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
