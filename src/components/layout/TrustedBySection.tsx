import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useSiteSettings } from '@/hooks/useSiteSettings';

export interface HomepageClient {
  id: string;
  name: string;
  logo_url: string;
  website_url?: string;
  display_order: number;
  is_active: boolean;
}

// Built-in vector SVG logos - Compact tight viewBoxes
export const CanvaLogo = ({ className = "h-8 sm:h-9 md:h-10" }: { className?: string }) => (
  <svg viewBox="0 0 115 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="canva-glow-loop" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#00C4CC" />
        <stop offset="60%" stopColor="#7D2AE8" />
        <stop offset="100%" stopColor="#FF416C" />
      </linearGradient>
    </defs>
    <circle cx="20" cy="20" r="16" fill="url(#canva-glow-loop)" />
    <text x="13" y="27" fontFamily="'Segoe UI', Roboto, sans-serif" fontWeight="900" fontStyle="italic" fontSize="20" fill="white">
      C
    </text>
    <text x="42" y="27" fontFamily="'Segoe UI', Roboto, sans-serif" fontWeight="900" fontSize="24" fill="currentColor" className="text-slate-900 dark:text-white" letterSpacing="-0.5">
      Canva
    </text>
  </svg>
);

export const PinterestLogo = ({ className = "h-8 sm:h-9 md:h-10" }: { className?: string }) => (
  <svg viewBox="0 0 135 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="20" cy="20" r="16" fill="#E60023" />
    <path
      d="M20 10 C14.5 10 10 14.5 10 20 C10 24.2 12.6 27.8 16.3 29.3 C16.2 28.5 16.1 27.3 16.3 26.4 C16.5 25.6 17.6 20.9 17.6 20.9 C17.6 20.9 17.3 20.2 17.3 19.2 C17.3 17.7 18.2 16.5 19.3 16.5 C20.3 16.5 20.8 17.2 20.8 18.1 C20.8 19.1 20.2 20.5 19.8 21.8 C19.5 23.0 20.4 24.0 21.6 24.0 C23.8 24.0 25.5 21.7 25.5 18.3 C25.5 15.3 23.4 13.2 20.3 13.2 C16.7 13.2 14.6 15.9 14.6 18.8 C14.6 19.9 15.0 21.1 15.5 21.7 C15.6 21.8 15.6 21.9 15.6 22.0 C15.5 22.4 15.2 23.6 15.1 23.8 C15.0 24.0 14.8 24.0 14.6 24.0 C13.0 23.2 12.0 20.9 12.0 18.7 C12.0 14.7 14.9 11.2 20.5 11.2 C25.0 11.2 28.5 14.4 28.5 18.6 C28.5 23.1 25.6 26.7 21.6 26.7 C20.3 26.7 19.0 26.0 18.6 25.2 L17.5 29.4 C17.1 30.9 16.0 32.7 15.2 33.9 C16.7 34.4 18.3 34.6 20.0 34.6 C28.1 34.6 34.6 28.1 34.6 20.0 C34.6 11.9 28.1 10 20 10 Z"
      fill="white"
    />
    <text x="42" y="27" fontFamily="'Segoe UI', Roboto, sans-serif" fontWeight="800" fontSize="22" fill="#E60023" letterSpacing="-0.5">
      Pinterest
    </text>
  </svg>
);

export const PosterMyWallLogo = ({ className = "h-8 sm:h-9 md:h-10" }: { className?: string }) => (
  <svg viewBox="0 0 165 40" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="6" width="28" height="28" rx="8" fill="#1877F2" />
    <path d="M12 12 H22 C24.5 12 26 13.5 26 16 C26 18.5 24.5 20 22 20 H16 V28 H12 V12 Z M16 16 V16.5 H21.5 C22.2 16.5 22.8 16 22.8 15.2 C22.8 14.5 22.2 14 21.5 14 H16 V16 Z" fill="white" />
    <text x="38" y="26" fontFamily="'Segoe UI', Roboto, sans-serif" fontWeight="900" fontSize="18" fill="currentColor" className="text-slate-900 dark:text-white" letterSpacing="-0.3">
      Poster<span className="text-[#1877F2]">MyWall</span>
    </text>
  </svg>
);

export const DEFAULT_HOMEPAGE_CLIENTS: HomepageClient[] = [
  { id: 'canva', name: 'Canva', logo_url: 'builtin:canva', website_url: 'https://www.canva.com', display_order: 1, is_active: true },
  { id: 'pinterest', name: 'Pinterest', logo_url: 'builtin:pinterest', website_url: 'https://www.pinterest.com', display_order: 2, is_active: true },
  { id: 'postermywall', name: 'PosterMyWall', logo_url: 'builtin:postermywall', website_url: 'https://www.postermywall.com', display_order: 3, is_active: true },
];

export const TrustedBySection: React.FC = () => {
  const { getSetting } = useSiteSettings();
  const title = getSetting('homepage_clients_title', 'Trusted by 100+ clients worldwide');
  const [isPaused, setIsPaused] = useState(false);

  // Parse admin-managed homepage clients
  let clients: HomepageClient[] = DEFAULT_HOMEPAGE_CLIENTS;
  try {
    const raw = getSetting('homepage_clients');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        clients = parsed;
      }
    }
  } catch (e) {
    console.error('Error parsing homepage_clients setting:', e);
  }

  const activeClients = clients
    .filter(c => c.is_active !== false)
    .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

  if (activeClients.length === 0) return null;

  // Build duplicated list for continuous infinite looping (6 sets ensures seamless coverage)
  const marqueeItems = [
    ...activeClients,
    ...activeClients,
    ...activeClients,
    ...activeClients,
    ...activeClients,
    ...activeClients,
  ];

  return (
    <section className="py-12 sm:py-14 bg-slate-50/70 dark:bg-background/80 border-t border-b border-slate-200/60 dark:border-white/5 transition-colors overflow-hidden relative">
      <div className="container mx-auto px-4 text-center mb-6">
        <motion.h3
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-lg sm:text-xl md:text-2xl font-black text-[#1A1028] dark:text-white tracking-tight font-lato"
        >
          {title}
        </motion.h3>
      </div>

      {/* Infinite Looping Marquee Wrapper */}
      <div
        className="relative w-full overflow-hidden"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Left Edge Gradient Fade */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 sm:w-24 bg-gradient-to-r from-slate-50/95 dark:from-background to-transparent z-10" />

        {/* Right Edge Gradient Fade */}
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 sm:w-24 bg-gradient-to-l from-slate-50/95 dark:from-background to-transparent z-10" />

        {/* Continuous Animated Track with Clean, Balanced Spacing */}
        <motion.div
          className="flex items-center gap-6 sm:gap-8 md:gap-10 w-max"
          animate={{
            x: isPaused ? undefined : ['0%', '-50%'],
          }}
          transition={{
            x: {
              repeat: Infinity,
              repeatType: 'loop',
              duration: 18,
              ease: 'linear',
            },
          }}
        >
          {marqueeItems.map((client, index) => {
            const content = (
              client.logo_url === 'builtin:canva' ? (
                <CanvaLogo />
              ) : client.logo_url === 'builtin:pinterest' ? (
                <PinterestLogo />
              ) : client.logo_url === 'builtin:postermywall' ? (
                <PosterMyWallLogo />
              ) : (
                <img
                  src={client.logo_url}
                  alt={client.name}
                  loading="lazy"
                  decoding="async"
                  className="h-8 sm:h-9 md:h-10 w-auto max-w-[140px] object-contain dark:brightness-110"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              )
            );

            if (client.website_url) {
              return (
                <a
                  key={`${client.id}-${index}`}
                  href={client.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center px-2 py-1 opacity-90 hover:opacity-100 hover:scale-105 transition-all duration-300 shrink-0 cursor-pointer"
                >
                  {content}
                </a>
              );
            }

            return (
              <div
                key={`${client.id}-${index}`}
                className="flex items-center justify-center px-2 py-1 opacity-90 hover:opacity-100 hover:scale-105 transition-all duration-300 shrink-0"
              >
                {content}
              </div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};
