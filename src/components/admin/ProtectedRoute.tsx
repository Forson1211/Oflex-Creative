import { ReactNode, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
  requireModerator?: boolean;
}

export const ProtectedRoute = ({
  children,
  requireAdmin = false,
  requireModerator = false
}: ProtectedRouteProps) => {
  const { user, loading, isAuthReady, isAdmin, isModerator } = useAuth();
  const navigate = useNavigate();

  // Wait for auth to be fully ready (session + role check)
  if (!isAuthReady || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Declarative redirects
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (requireModerator && !isModerator) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
