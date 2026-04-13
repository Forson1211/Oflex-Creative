import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, MessageSquare, X, Send, Bot, User, ChevronRight, ShoppingBag, Palette, Zap } from 'lucide-react';
import { Button } from './button';
import { GlassCard } from './GlassCard';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

import { useSiteSettings } from '@/hooks/useSiteSettings';

interface Message {
  id: string;
  text: string;
  sender: 'bot' | 'user';
  timestamp: Date;
  actions?: { label: string; onClick: () => void }[];
}

export const AICreativeAssistant = () => {
  const { getSetting } = useSiteSettings();
  const [isOpen, setIsOpen] = useState(false);
  
  const aiName = getSetting('ai_assistant_name', 'Oflex Creative Assistant');
  const companyBio = getSetting('ai_company_bio', '');
  const customKnowledge = getSetting('ai_custom_knowledge', '');

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: `Hello! I'm ${aiName}. How can I help you elevate your project today?`,
      sender: 'bot',
      timestamp: new Date(),
      actions: [
        { label: 'Recommend a Template', onClick: () => handleAction('recommend') },
        { label: 'Explore Services', onClick: () => handleAction('services') },
        { label: 'View Portfolio', onClick: () => handleAction('portfolio') }
      ]
    }
  ]);

  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleAction = (action: string) => {
    setIsTyping(true);
    let botResponse = "";
    let actions: Message['actions'] = [];

    setTimeout(() => {
      if (action === 'recommend') {
        botResponse = "Based on our latest premium collection, I recommend checking out our 'Modern SaaS' or 'Creative Portfolio' templates. They are currently trending!";
        actions = [{ label: 'Go to Store', onClick: () => navigate('/store') }];
      } else if (action === 'services') {
        botResponse = "We offer Brand Identity, UI/UX Design, and Full-Stack Development. Which area should we focus on?";
        actions = [{ label: 'See All Services', onClick: () => navigate('/services') }];
      } else if (action === 'portfolio') {
        botResponse = "You can view our award-winning projects in the Portfolio section. We've recently added 5 new masterpieces!";
        actions = [{ label: 'View Portfolio', onClick: () => navigate('/portfolio') }];
      }

      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        text: botResponse,
        sender: 'bot',
        timestamp: new Date(),
        actions
      }]);
      setIsTyping(false);
    }, 1000);
  };

  const getBotResponse = (input: string): { text: string; actions?: Message['actions'] } => {
    const text = input.toLowerCase();
    
    // Check Custom Knowledge Base (Dynamic Training)
    if (customKnowledge) {
      const facts = customKnowledge.split('\n');
      for (const fact of facts) {
        const [keyword, answer] = fact.split(':');
        if (keyword && answer && text.includes(keyword.trim().toLowerCase())) {
          return { text: answer.trim() };
        }
      }
    }

    // Knowledge Base Logic
    if (text.includes('price') || text.includes('cost') || text.includes('how much')) {
      return {
        text: "Our studio operates on a value-based pricing model. Standard flyers and templates range from $20-$80, while custom brand identity projects typically start at $500. We thrive on providing surgical precision in every pixel, ensuring you get elite value for your investment.",
        actions: [{ label: 'View Price List', onClick: () => navigate('/store') }]
      };
    }
    
    if (text.includes('service') || text.includes('offer') || text.includes('what do you do')) {
      return {
        text: "We specialize in '90-Degree' high-end design. Our core pillars are Brand Identity, UI/UX Design for Web & App, and Digital Marketing Assets. Each project is handled with extreme attention to architectural detail.",
        actions: [{ label: 'Explore Services', onClick: () => navigate('/services') }]
      };
    }

    if (text.includes('time') || text.includes('fast') || text.includes('how long')) {
      return {
        text: "Performance is one of our obsessed metrics. Small design assets like flyers take 24-48 hours. Larger projects like full brand identities or complex web apps are delivered in phases to ensure elite quality.",
      };
    }

    if (text.includes('about') || text.includes('who are you') || text.includes('team')) {
      return {
        text: companyBio || "Oflex Creative Studio is a team of design architects dedicated to surgical visual precision. We don't just 'design'; we build visual systems that command attention and drive conversions. We are based globally and serve elite clients who appreciate high-end aesthetics.",
        actions: [{ label: 'Meet the Team', onClick: () => navigate('/about') }]
      };
    }

    if (text.includes('contact') || text.includes('book') || text.includes('hire') || text.includes('talk')) {
      return {
        text: "I can fast-track your inquiry! You can book a direct consultation through our contact form, or I can notify a project manager right now that you're interested.",
        actions: [{ label: 'Go to Contact', onClick: () => navigate('/contact') }]
      };
    }

    if (text.includes('hello') || text.includes('hi ') || text.includes('hey')) {
      return {
        text: "Greetings! I'm synchronized and ready to assist. Are we looking to start a new project or explore our premium store templates today?",
        actions: [
          { label: 'Start Project', onClick: () => navigate('/contact') },
          { label: 'Browse Store', onClick: () => navigate('/store') }
        ]
      };
    }

    // Default Fallback
    return {
      text: "That sounds intriguing. To give you the most 'Oflex' answer, could you specify if this is regarding a custom design project, a store purchase, or general collaboration?",
      actions: [
        { label: 'Custom Project', onClick: () => handleAction('services') },
        { label: 'Store Help', onClick: () => handleAction('recommend') }
      ]
    };
  };

  const handleSend = () => {
    if (!inputText.trim()) return;

    const userMsg = inputText.trim();
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      text: userMsg,
      sender: 'user',
      timestamp: new Date()
    }]);
    setInputText('');
    setIsTyping(true);

    setTimeout(() => {
      const response = getBotResponse(userMsg);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        text: response.text,
        sender: 'bot',
        timestamp: new Date(),
        actions: response.actions
      }]);
      setIsTyping(false);
    }, 1200);
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "fixed bottom-8 right-8 z-[100] w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-500 overflow-hidden",
          isOpen ? "bg-red-500 rotate-90" : "bg-primary"
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
        {isOpen ? (
          <X className="w-6 h-6 text-white relative z-10" />
        ) : (
          <div className="relative z-10">
            <Sparkles className="w-6 h-6 text-white animate-pulse" />
          </div>
        )}
        
        {/* Glow effect */}
        {!isOpen && (
           <div className="absolute inset-0 animate-ping opacity-20 bg-primary blur-xl" />
        )}
      </motion.button>

      {/* Assistant Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9, x: 20 }}
            animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
            exit={{ opacity: 0, y: 50, scale: 0.9, x: 20 }}
            className="fixed bottom-24 right-8 z-[100] w-full max-w-[400px] h-[600px] max-h-[80vh]"
          >
            <GlassCard className="w-full h-full flex flex-col border-primary/20 bg-background/80 backdrop-blur-2xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] overflow-hidden">
              {/* Header */}
              <div className="p-4 border-b border-primary/10 flex items-center justify-between bg-primary/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black tracking-tight text-foreground uppercase">Creative AI</h3>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Active Assistant</span>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="rounded-xl">
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Chat Content */}
              <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth no-scrollbar"
              >
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, x: msg.sender === 'bot' ? -10 : 10, y: 10 }}
                    animate={{ opacity: 1, x: 0, y: 0 }}
                    className={cn(
                      "flex gap-3",
                      msg.sender === 'user' ? "flex-row-reverse" : "flex-row"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-1",
                      msg.sender === 'bot' ? "bg-primary/20 text-primary" : "bg-accent/20 text-accent-foreground"
                    )}>
                      {msg.sender === 'bot' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    </div>
                    
                    <div className={cn(
                      "space-y-3 max-w-[80%]",
                      msg.sender === 'user' ? "items-end" : "items-start"
                    )}>
                      <div className={cn(
                        "p-4 rounded-2xl text-sm font-medium leading-relaxed shadow-sm",
                        msg.sender === 'bot' 
                          ? "bg-muted/50 text-foreground rounded-tl-none border border-border/40" 
                          : "bg-primary text-white rounded-tr-none"
                      )}>
                        {msg.text}
                      </div>

                      {msg.actions && msg.actions.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {msg.actions.map((action, i) => (
                            <button
                              key={i}
                              onClick={action.onClick}
                              className="px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black text-primary uppercase tracking-widest hover:bg-primary/20 transition-colors flex items-center gap-1.5"
                            >
                              {action.label}
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}

                {isTyping && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary shrink-0">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="bg-muted/50 p-4 rounded-2xl rounded-tl-none flex gap-1 items-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '0s' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '0.2s' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '0.4s' }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="p-4 border-t border-primary/10 bg-primary/5">
                <div className="relative group">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Ask about design, templates, or services..."
                    className="w-full h-12 bg-background/50 border border-primary/20 rounded-xl px-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all placeholder:text-muted-foreground/60"
                  />
                  <button
                    onClick={handleSend}
                    className="absolute right-2 top-1.5 w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/30 hover:scale-105 active:scale-95 transition-all"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                <p className="mt-3 text-[9px] text-center text-muted-foreground font-bold uppercase tracking-widest">
                  Powered by Oflex Creative Intelligence
                </p>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
