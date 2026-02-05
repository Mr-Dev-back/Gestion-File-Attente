import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore, type UserRole } from '../../../stores/useAuthStore';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles?: UserRole[];
    requiredPermission?: string;
}

export const ProtectedRoute = ({ children, allowedRoles, requiredPermission }: ProtectedRouteProps) => {
    const { user, isAuthenticated, hasPermission } = useAuthStore();
    const location = useLocation();

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        return <Navigate to="/unauthorized" replace />;
    }

    if (requiredPermission && !hasPermission(requiredPermission)) {
        return <Navigate to="/unauthorized" replace />;
    }

    return <>{children}</>;
};
