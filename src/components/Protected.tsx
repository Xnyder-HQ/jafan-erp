import { Navigate, Outlet, useLocation } from 'react-router';
import { useGeneral } from '../context/GeneralContext';

interface ProtectedProps {
  requireAuth?: boolean;
}

const Protected = ({ requireAuth = true }: ProtectedProps) => {
  const { isAuthenticated, isLoading } = useGeneral();
  const location = useLocation();

  if (isLoading) {
    return null;
  }

  if (requireAuth) {
    if (!isAuthenticated) {
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
  } else {
    if (isAuthenticated) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <Outlet />;
};

export default Protected;
