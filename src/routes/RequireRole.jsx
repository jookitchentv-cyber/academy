import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_HOME = { student: '/student', teacher: '/teacher', parent: '/parent' };

export default function RequireRole({ role }) {
  const { session } = useAuth();

  if (!session) return <Navigate to="/" replace />;
  if (session.role !== role) {
    return <Navigate to={ROLE_HOME[session.role] ?? '/'} replace />;
  }
  return <Outlet />;
}
