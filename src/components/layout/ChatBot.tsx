import { useEffect } from 'react';

export const ChatBot = () => {
    useEffect(() => {
        // Tawk.to Script Implementation
        const script = document.createElement("script");
        script.async = true;
        script.src = 'https://embed.tawk.to/6912f7422dd55f195fde91b0/1jg7s0pcm';
        script.charset = 'UTF-8';
        script.setAttribute('crossorigin', '*');

        // Ensure Tawk_API is initialized
        window.Tawk_API = window.Tawk_API || {};
        window.Tawk_LoadStart = new Date();

        const s0 = document.getElementsByTagName("script")[0];
        if (s0 && s0.parentNode) {
            s0.parentNode.insertBefore(script, s0);
        }

        return () => {
            // Cleanup if needed (Tawk.to usually persists, but we can try to hide it)
            if (window.Tawk_API && typeof window.Tawk_API.hideWidget === 'function') {
                window.Tawk_API.hideWidget();
            }
        };
    }, []);

    return null;
};

// Add TypeScript declaration for Tawk_API
declare global {
    interface Window {
        Tawk_API: any;
        Tawk_LoadStart: Date;
    }
}
