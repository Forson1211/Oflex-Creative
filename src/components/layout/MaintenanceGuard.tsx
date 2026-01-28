import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useAuth } from '@/hooks/useAuth';
import Maintenance from '@/pages/Maintenance';

export const MaintenanceGuard = ({ children }: { children: ReactNode }) => {
    const { maintenanceMode, isLoading: settingsLoading } = useSiteSettings();
    const { isAdmin, isModerator, isAuthReady } = useAuth();
    const location = useLocation();

    // 1. Path Bypass: Always allow these routes (Auth, Admin, etc.)
    const path = location.pathname.toLowerCase();
    if (path.startsWith('/auth') || path.startsWith('/admin') || path.startsWith('/access-denied')) {
        return <>{children}</>;
    }

    // 2. Role Bypass: Always allow Admins and Moderators to see the site
    if (isAdmin || isModerator) {
        return <>{children}</>;
    }

    // 3. Status Bypass: Show site during loading to prevent flickering
    if (!isAuthReady || settingsLoading) {
        return <>{children}</>;
    }

    // 4. Maintenance Mode: Show maintenance screen for everyone else
    if (maintenanceMode) {
        return <Maintenance />;
    }

    return <>{children}</>;
};
