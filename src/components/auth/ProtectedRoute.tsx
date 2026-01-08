import { ReactNode, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth, useUserRoles } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: ReactNode;
  hotelId: string | null;
  requireAdmin?: boolean;
}

export function ProtectedRoute({ children, hotelId, requireAdmin = false }: ProtectedRouteProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isStaff, loading: rolesLoading } = useUserRoles(user?.id, hotelId);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate(`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`);
      return;
    }

    if (!authLoading && !rolesLoading && user && hotelId) {
      if (requireAdmin && !isAdmin) {
        navigate("/unauthorized");
        return;
      }
      if (!requireAdmin && !isStaff) {
        navigate("/unauthorized");
        return;
      }
    }
  }, [authLoading, rolesLoading, user, hotelId, isAdmin, isStaff, requireAdmin, navigate, location]);

  if (authLoading || rolesLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (requireAdmin && !isAdmin) {
    return null;
  }

  if (!requireAdmin && !isStaff) {
    return null;
  }

  return <>{children}</>;
}
