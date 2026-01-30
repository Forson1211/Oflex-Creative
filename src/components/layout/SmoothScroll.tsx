import { useEffect } from 'react';
import Lenis from 'lenis';

export const SmoothScroll = () => {
    useEffect(() => {
        const lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            orientation: 'vertical',
            gestureOrientation: 'vertical',
            smoothWheel: true,
            wheelMultiplier: 1,
            touchMultiplier: 2,
            infinite: false,
        });

        function raf(time: number) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }

        requestAnimationFrame(raf);

        // Add pointer-events: none to body while scrolling to improve FPS
        let isScrolling: any;
        lenis.on('scroll', () => {
            document.body.style.pointerEvents = 'none';
            clearTimeout(isScrolling);
            isScrolling = setTimeout(() => {
                document.body.style.pointerEvents = 'auto';
            }, 66);
        });

        return () => {
            lenis.destroy();
        };
    }, []);

    return null;
};
