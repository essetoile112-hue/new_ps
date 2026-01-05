import type { ReactElement } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../utils/useAuth';

type Props = {
  children: ReactElement;
};

export default function ProtectedRoute({ children }: Props) {
  const { user, loading } = useAuth();

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-teal-900 to-teal-800">
        <div className="text-center">
          <div className="inline-block">
            <div className="w-12 h-12 border-4 border-teal-300 border-t-white rounded-full animate-spin"></div>
          </div>
          <p className="text-white mt-4 text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  // Redirect to auth if not logged in
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return children;
}
