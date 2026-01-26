
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export const useSiteTracking = () => {
    const location = useLocation();

    useEffect(() => {
        const trackPageView = async () => {
            try {
                // Track page view
                await (supabase.rpc as any)('update_daily_analytics', {
                    col_name: 'page_views',
                    increment_val: 1
                });

                // Track unique visitor using session storage
                const hasVisitedThisSession = sessionStorage.getItem('has_visited_this_session');
                if (!hasVisitedThisSession) {
                    await (supabase.rpc as any)('update_daily_analytics', {
                        col_name: 'unique_visitors',
                        increment_val: 1
                    });
                    sessionStorage.setItem('has_visited_this_session', 'true');
                }
            } catch (error) {
                console.error('Analytics tracking failed:', error);
            }
        };

        trackPageView();
    }, [location.pathname]); // Re-run on route change
};
