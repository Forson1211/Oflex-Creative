import { motion } from 'framer-motion';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useEffect, useState } from 'react';

export const LoadingScreen = () => {
  const { getSetting } = useSiteSettings();
  const faviconUrl = getSetting('favicon_url') || '/favicon.png';
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Preload essential static assets while loading screen is active
    const assetsToPreload = [
      faviconUrl,
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
  }, [faviconUrl]);

  useEffect(() => {
    const startTime = Date.now();
    const duration = 3000; // 3 seconds loading animation

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(pct);
      if (pct >= 100) clearInterval(interval);
    }, 30);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-50 dark:bg-[#0F0A1E] text-slate-900 dark:text-white transition-colors duration-300">
      <div className="flex flex-col items-center gap-6">
        {/* Animated Spinner with Large Favicon Logo centered */}
        <div className="relative w-32 h-32 flex items-center justify-center">
          {/* Outer glowing track */}
          <div className="absolute inset-0 rounded-full border-4 border-[#FF5500]/20 shadow-[0_0_30px_rgba(255,85,0,0.15)]" />
          
          {/* Outer spinning gradient arc */}
          <motion.div
            className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#FF5500] border-r-[#FF5500]"
            animate={{ rotate: 360 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
          />

          {/* Secondary inner counter-spinning arc */}
          <motion.div
            className="absolute inset-2.5 rounded-full border-2 border-transparent border-b-[#FF5500]/60 border-l-[#FF5500]/60"
            animate={{ rotate: -360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          />

          {/* Large Centered Favicon Logo */}
          <motion.div
            className="relative w-20 h-20 flex items-center justify-center"
            animate={{ scale: [0.95, 1.05, 0.95] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <img
              src={faviconUrl}
              alt="Oflex Studio Logo"
              className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(255,85,0,0.25)]"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/favicon.png';
              }}
            />
          </motion.div>
        </div>

        {/* Brand Text & Dynamic Theme Progress Bar */}
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-xs font-bold tracking-[0.25em] uppercase text-slate-800 dark:text-white/90">
            OFLEX CREATIVE STUDIO
          </p>
          <div className="w-48 h-1.5 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden border border-slate-300/40 dark:border-white/5">
            <motion.div
              className="h-full bg-gradient-to-r from-[#FF5500] to-[#ff8c42] rounded-full"
              style={{ width: `${progress}%` }}
              transition={{ ease: 'easeOut' }}
            />
          </div>
          <span className="text-[11px] font-semibold text-slate-500 dark:text-white/40">
            Loading studio assets... {progress}%
          </span>
        </div>
      </div>
    </div>
  );
};
