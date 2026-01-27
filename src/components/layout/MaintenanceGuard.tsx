import { ReactNode } from 'react';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useAuth } from '@/hooks/useAuth';
import Maintenance from '@/pages/Maintenance';

export const MaintenanceGuard = ({ children }: { children: ReactNode }) => {
    const { maintenanceMode, isLoading } = useSiteSettings();
    const { isAdmin, isModerator } = useAuth();

    // If loading or admin/moderator, bypass maintenance check
    if (isLoading || isAdmin || isModerator) {
        return <>{children}</>;
    }

    if (maintenanceMode) {
        return <Maintenance />;
    }

    return <>{children}</>;
};
