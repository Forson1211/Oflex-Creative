import { motion } from 'framer-motion';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useEffect } from 'react';

export const LoadingScreen = () => {
  const { getSetting } = useSiteSettings();
  const logoUrl = getSetting('favicon_url') || '/favicon.png';

  useEffect(() => {
    // Preload essential static assets while loading screen is active
    const assetsToPreload = [
      logoUrl,
      '/favicon.png',
      '/logo.png',
      '/logo-white.png',
      '/Banner.jpg',
      '/B1.jpg',
      '/B2.jpg',
      '/B3.jpg',
    ];
    assetsToPreload.forEach(src => {
      if (src) {
        const img = new Image();
        img.src = src;
      }
    });
  }, [logoUrl]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-50 dark:bg-[#0F0A1E] text-slate-900 dark:text-white transition-colors duration-300">
      {/* Centered Logo Only */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{
          opacity: 1,
          scale: [0.95, 1.05, 0.95],
        }}
        transition={{
          opacity: { duration: 0.3 },
          scale: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
        }}
        className="relative w-28 h-28 sm:w-36 sm:h-36 flex items-center justify-center select-none"
      >
        <img
          src={logoUrl}
          alt="Oflex Studio Logo"
          className="w-full h-full object-contain drop-shadow-[0_10px_25px_rgba(255,85,0,0.2)]"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = '/favicon.png';
          }}
        />
      </motion.div>
    </div>
  );
};
