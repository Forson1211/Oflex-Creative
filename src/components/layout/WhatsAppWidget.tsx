import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Sparkles, MessageSquare } from 'lucide-react';
import { useSiteSettings } from '@/hooks/useSiteSettings';

export const WhatsAppIcon = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    width="24"
    height="24"
    stroke="currentColor"
    strokeWidth="0"
    fill="currentColor"
    className={className}
  >
    <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zM12.04 20.21c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.217 8.217 0 0 1-1.26-4.44c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.54-3.7 8.24-8.25 8.24zm4.52-6.17c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.79.98-.14.17-.29.19-.54.07-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.39-1.72-.14-.25-.02-.38.11-.5.11-.11.25-.29.37-.43.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.43s-.56-1.34-.76-1.84c-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.84-.86 2.05s.88 2.38 1 2.55c.12.17 1.73 2.65 4.2 3.71.59.25 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.1-.23-.17-.48-.29z" />
  </svg>
);

const QUICK_PROMPTS = [
  "🎨 Inquire about Design & Branding",
  "💻 Custom Web Development",
  "🛍️ Store & Products Inquiry",
  "💬 General Questions",
];

export const WhatsAppWidget: React.FC = () => {
  const { getSetting } = useSiteSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [hasInteracted, setHasInteracted] = useState(false);

  // Clean up any residual Tawk.to elements if previously injected in the browser session
  useEffect(() => {
    try {
      const tawkScripts = document.querySelectorAll('script[src*="tawk.to"]');
      tawkScripts.forEach(s => s.remove());

      const tawkElements = document.querySelectorAll('[id^="tawk"], .tawk-min-container, .tawk-custom-bubble');
      tawkElements.forEach(el => el.remove());

      if (typeof window !== 'undefined' && (window as any).Tawk_API) {
        try {
          (window as any).Tawk_API.hideWidget?.();
        } catch (e) {
          // ignore
        }
        delete (window as any).Tawk_API;
      }
    } catch (err) {
      console.debug('Tawk cleanup exception:', err);
    }
  }, []);

  // WhatsApp number resolution: checks 'whatsapp_number' then 'phone_number', then fallback
  const rawNumber = getSetting('whatsapp_number') || getSetting('phone_number') || '+233552097017';
  const cleanNumber = rawNumber.replace(/[^\d]/g, '');
  const siteName = getSetting('site_name', 'Oflex Creative');
  const siteLogo = getSetting('logo_url') || getSetting('logo_white_url') || '/favicon.png';

  const defaultGreeting = getSetting(
    'whatsapp_message',
    `Hello ${siteName}, I would like to inquire about your services.`
  );

  const handleOpenWhatsApp = (customText?: string) => {
    const textToSend = (customText || message || defaultGreeting).trim();
    const url = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(textToSend)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    setIsOpen(false);
    setMessage('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleOpenWhatsApp();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none select-none">
      {/* Floating Chat Modal Popup */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.92 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="pointer-events-auto mb-4 w-[90vw] max-w-[360px] rounded-3xl overflow-hidden shadow-2xl border border-border/40 bg-card text-card-foreground backdrop-blur-xl"
            style={{
              boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.4), 0 0 20px rgba(37, 211, 102, 0.15)',
            }}
          >
            {/* Header */}
            <div className="bg-[#25D366] text-white p-4 sm:p-5 relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-11 h-11 rounded-2xl bg-white/20 p-1 flex items-center justify-center backdrop-blur-md overflow-hidden shadow-inner">
                      <img
                        src={siteLogo}
                        alt={siteName}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                    {/* Live Online Badge */}
                    <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#10B981] border-2 border-[#25D366] ring-1 ring-white/50 animate-pulse" />
                  </div>

                  <div>
                    <h3 className="font-bold text-base leading-tight tracking-tight flex items-center gap-1.5">
                      {siteName}
                      <Sparkles className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />
                    </h3>
                    <p className="text-xs text-white/90 font-medium flex items-center gap-1 mt-0.5">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-300" />
                      Typically replies in minutes
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close WhatsApp chat popup"
                  className="w-8 h-8 rounded-full bg-black/10 hover:bg-black/20 text-white flex items-center justify-center transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Chat Body */}
            <div className="p-4 sm:p-5 space-y-4 bg-muted/20 dark:bg-background/40 max-h-[380px] overflow-y-auto">
              {/* Automated Greeting Bubble */}
              <div className="flex gap-2.5 items-start">
                <div className="w-7 h-7 rounded-full bg-[#25D366]/15 flex items-center justify-center flex-shrink-0 mt-0.5 text-[#25D366]">
                  <WhatsAppIcon className="w-4 h-4" />
                </div>
                <div className="bg-background dark:bg-muted/60 border border-border/50 rounded-2xl rounded-tl-sm p-3.5 text-sm shadow-sm leading-relaxed max-w-[85%]">
                  <p className="font-normal text-foreground">
                    Hello there! 👋 How can we help you bring your creative ideas to life today?
                  </p>
                  <span className="text-[10px] text-muted-foreground mt-1.5 block text-right">
                    Just now
                  </span>
                </div>
              </div>

              {/* Quick Inquiry Options */}
              <div className="space-y-2 pt-1">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80 px-1">
                  Quick Inquiries
                </p>
                <div className="flex flex-col gap-1.5">
                  {QUICK_PROMPTS.map((prompt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleOpenWhatsApp(prompt)}
                      className="text-left text-xs font-medium px-3.5 py-2.5 rounded-xl bg-background hover:bg-[#25D366]/10 hover:text-[#25D366] dark:bg-muted/40 dark:hover:bg-[#25D366]/20 border border-border/40 hover:border-[#25D366]/40 transition-all flex items-center justify-between group"
                    >
                      <span className="truncate">{prompt}</span>
                      <Send className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-[#25D366] flex-shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Input & Direct Send Footer */}
            <div className="p-3 sm:p-4 bg-background border-t border-border/40">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message..."
                  className="flex-1 text-sm bg-muted/50 dark:bg-muted/30 border border-border/60 rounded-full px-4 py-2.5 outline-none focus:ring-2 focus:ring-[#25D366] focus:border-transparent transition-all placeholder:text-muted-foreground/70"
                />
                <button
                  type="button"
                  onClick={() => handleOpenWhatsApp()}
                  aria-label="Send message on WhatsApp"
                  className="w-10 h-10 rounded-full bg-[#25D366] hover:bg-[#20BA5A] text-white flex items-center justify-center flex-shrink-0 shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all"
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              </div>

              <div className="mt-2.5 text-center">
                <button
                  type="button"
                  onClick={() => handleOpenWhatsApp()}
                  className="text-[11px] text-muted-foreground hover:text-[#25D366] font-medium transition-colors inline-flex items-center gap-1.5"
                >
                  <WhatsAppIcon className="w-3 h-3 fill-current" />
                  Direct chat on WhatsApp
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Trigger Button */}
      <div className="pointer-events-auto relative flex items-center gap-3">
        {/* Subtle Tooltip Label on Hover or Initial State */}
        {!isOpen && !hasInteracted && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.5, duration: 0.4 }}
            className="hidden sm:flex items-center gap-2 bg-card/95 text-foreground border border-border/60 px-3.5 py-1.5 rounded-full shadow-lg text-xs font-medium backdrop-blur-md"
          >
            <span className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse" />
            Chat with us
          </motion.div>
        )}

        <motion.button
          type="button"
          onClick={() => {
            setIsOpen((prev) => !prev);
            setHasInteracted(true);
          }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          aria-label="Open WhatsApp chat"
          className="relative w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#20BA5A] text-white flex items-center justify-center shadow-2xl transition-colors group cursor-pointer focus:outline-none focus:ring-4 focus:ring-[#25D366]/40"
          style={{
            boxShadow: '0 8px 24px rgba(37, 211, 102, 0.45), 0 2px 8px rgba(0, 0, 0, 0.2)',
          }}
        >
          {/* Animated Glow Aura */}
          <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-25 group-hover:opacity-40 pointer-events-none" />

          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <X className="w-6 h-6" />
              </motion.div>
            ) : (
              <motion.div
                key="whatsapp"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center justify-center"
              >
                <WhatsAppIcon className="w-7 h-7 fill-white" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Unread Message / Online Notification Badge */}
          {!isOpen && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-background shadow-md animate-bounce">
              1
            </span>
          )}
        </motion.button>
      </div>
    </div>
  );
};
