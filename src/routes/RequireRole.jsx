import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RequireRole({ role }) {
  const { session } = useAuth();

  if (!session) return <Navigate to="/" replace />;
  if (session.role !== role) {
    return <Navigate to={session.role === 'student' ? '/student' : '/teacher'} replace />;
  }
  return <Outlet />;
}
