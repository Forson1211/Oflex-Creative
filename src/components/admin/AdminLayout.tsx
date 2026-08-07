import { ReactNode, useMemo, useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Home,
  Briefcase,
  Palette,
  MessageSquare,
  HelpCircle,
  Layers,
  Lock,
  Mail,
  Bell,
  Star,
  Handshake,
  Info,
  FileText,
  Sparkles,
  ShoppingBag,
  User,
  Search,
  Calendar as CalendarIcon,
  ChevronDown,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useRealtimeOrders } from '@/hooks/useRealtimeOrders';
import { useAdminStats } from '@/hooks/useAdminStats';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useProfile } from '@/hooks/useUsers';
import { getOptimizedImageUrl } from '@/lib/image-optimizer';
import { useOrders } from '@/hooks/useOrders';
import { useProducts } from '@/hooks/useProducts';
import { Calendar as UICalendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DateRange } from 'react-day-picker';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface AdminLayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard, access: 'moderator', section: 'Main' },
  { path: '/admin/hero-slides', label: 'Hero Slides', icon: Layers, access: 'moderator', section: 'Content' },
  { path: '/admin/featured-projects', label: 'Featured Projects', icon: Star, access: 'moderator', section: 'Content' },
  { path: '/admin/portfolio', label: 'Portfolio', icon: Briefcase, access: 'moderator', section: 'Content' },
  { path: '/admin/services', label: 'Services', icon: Sparkles, access: 'moderator', section: 'Content' },
  { path: '/admin/products', label: 'Products', icon: ShoppingBag, access: 'moderator', section: 'Store' },
  { path: '/admin/orders', label: 'Orders', icon: ShoppingCart, access: 'moderator', section: 'Store' },
  { path: '/admin/testimonials', label: 'Testimonials', icon: MessageSquare, access: 'moderator', section: 'Content' },
  { path: '/admin/faqs', label: 'FAQs', icon: HelpCircle, access: 'moderator', section: 'Content' },
  { path: '/admin/about', label: 'About Page', icon: Info, access: 'moderator', section: 'Content' },
  { path: '/admin/trusted-partners', label: 'Trusted Partners', icon: Handshake, access: 'moderator', section: 'Content' },
  { path: '/admin/blog-posts', label: 'Blog Posts', icon: FileText, access: 'moderator', section: 'Content' },
  { path: '/admin/newsletter', label: 'Newsletter', icon: Mail, access: 'moderator', section: 'Communication' },
  { path: '/admin/messages', label: 'Contact Messages', icon: MessageSquare, access: 'moderator', section: 'Communication' },
  { path: '/admin/users', label: 'User Management', icon: Users, access: 'admin', section: 'Administration' },
  { path: '/admin/customization', label: 'Customization', icon: Palette, access: 'admin', section: 'Administration' },
  { path: '/admin/settings', label: 'Settings', icon: Settings, access: 'admin', section: 'Administration' },
  { path: '/admin/profile', label: 'My Profile', icon: User, access: 'moderator', section: 'Account' },
];

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { signOut, user, isAdmin, isModerator } = useAuth();
  const { getSetting, currencySymbol } = useSiteSettings();
  const { data: adminStats } = useAdminStats();
  const { data: orders = [] } = useOrders();
  const { data: products = [] } = useProducts();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: profile } = useProfile(user?.id);
  const shouldEnableRealtime = isAdmin || isModerator;
  const pendingOrderCount = adminStats?.pending_orders || 0;

  // Interactive Header Control States
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Interactive Calendar Picker State
  const [selectedDateRange, setSelectedDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: new Date(Date.now() + 7 * 86400000),
  });

  const formattedDateRange = useMemo(() => {
    if (selectedDateRange?.from) {
      if (selectedDateRange.to) {
        return `${selectedDateRange.from.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${selectedDateRange.to.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      }
      return selectedDateRange.from.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
    return `${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${new Date(Date.now() + 7 * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  }, [selectedDateRange]);

  // Global ⌘K / Ctrl+K keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useRealtimeOrders({ enabled: shouldEnableRealtime });

  const handleSignOut = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    try { await signOut(); } catch (error) { console.error('Logout failed', error); }
    finally { navigate('/auth'); }
  };

  const accessibleNavItems = navItems.filter((item) => {
    if (isAdmin) return true;
    if (isModerator && item.access === 'moderator') return true;
    return false;
  });

  const navSections = useMemo(() => {
    const sections: Record<string, typeof navItems> = {};
    accessibleNavItems.forEach(item => {
      if (!sections[item.section]) sections[item.section] = [];
      sections[item.section].push(item);
    });
    return sections;
  }, [accessibleNavItems]);

  const getRoleLabel = () => {
    if (isAdmin) return 'Admin';
    if (isModerator) return 'Moderator';
    return 'User';
  };

  const getPageTitle = () => {
    const currentItem = navItems.find(item => item.path === location.pathname);
    if (currentItem) return currentItem.label;
    if (location.pathname.startsWith('/admin/orders/')) return 'Order Details';
    if (location.pathname.startsWith('/admin/products/')) return 'Product Details';
    if (location.pathname.startsWith('/admin/blog-posts/')) return 'Blog Post Details';
    return 'Dashboard';
  };

  // Real-time Global Search Filtering
  const filteredSearchItems = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    
    const prodMatches = products
      .filter(p => p.title.toLowerCase().includes(q) || (p.category && p.category.toLowerCase().includes(q)))
      .slice(0, 4)
      .map(p => ({
        id: p.id,
        title: p.title,
        subtitle: `${p.category || 'Product'} · ${currencySymbol}${p.price}`,
        type: 'Product',
        path: `/admin/products`,
      }));

    const orderMatches = orders
      .filter(o => o.id.toLowerCase().includes(q) || o.status?.toLowerCase().includes(q))
      .slice(0, 4)
      .map(o => ({
        id: o.id,
        title: `Order #${o.id.slice(0, 8)}`,
        subtitle: `Status: ${o.status} · ${currencySymbol}${o.total_amount}`,
        type: 'Order',
        path: `/admin/orders`,
      }));

    const navMatches = accessibleNavItems
      .filter(n => n.label.toLowerCase().includes(q))
      .slice(0, 3)
      .map(n => ({
        id: n.path,
        title: n.label,
        subtitle: `Section: ${n.section}`,
        type: 'Navigation',
        path: n.path,
      }));

    return [...prodMatches, ...orderMatches, ...navMatches];
  }, [searchQuery, products, orders, accessibleNavItems, currencySymbol]);

  const Sidebar = () => (
    <div className="flex flex-col h-full bg-[#1A1028] text-white overflow-hidden">
      {/* Logo - Pinned Top aligned in a straight horizontal line with Header Bar */}
      <div className="h-20 border-b border-white/10 px-6 flex items-center justify-between flex-shrink-0">
        <Link to="/admin" className="flex items-center gap-3">
          <img
            src={getSetting('logo_white_url') || getSetting('logo_dark_url') || '/logo-white.png'}
            alt={getSetting('site_name') || "OFLEX Studio"}
            className="h-16 max-h-16 w-auto object-contain transition-all hover:scale-105 origin-left"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const parent = e.currentTarget.parentElement;
              if (parent && !parent.querySelector('.logo-fallback')) {
                const badge = document.createElement('div');
                badge.className = 'logo-fallback flex items-center gap-3 font-black text-2xl tracking-tight text-white';
                badge.innerHTML = '<span class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#FF5500] to-[#ff8c42] flex items-center justify-center text-white text-base font-black shadow-xl shadow-[#FF5500]/50">O</span><span class="text-2xl font-black tracking-tight">OFLEX</span>';
                parent.appendChild(badge);
              }
            }}
          />
        </Link>
        <button
          className="lg:hidden text-white/60 hover:text-white transition-colors"
          onClick={() => setSidebarOpen(false)}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation - Inner Scroll Within Sidebar */}
      <nav
        className="flex-1 min-h-0 overflow-y-auto py-2 px-3 space-y-4 no-scrollbar overscroll-contain"
        data-lenis-prevent
      >
        {Object.entries(navSections).map(([section, items]) => (
          <div key={section}>
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/25 px-3 mb-1.5 mt-2">{section}</p>
            <div className="space-y-0.5">
              {items.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`relative flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group text-sm font-medium ${
                      isActive
                        ? 'bg-gradient-to-r from-[#FF5500] to-[#ff8c42] text-white shadow-lg shadow-[#FF5500]/25'
                        : 'text-white/55 hover:bg-white/6 hover:text-white'
                    }`}
                  >
                    <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    {item.path === '/admin/orders' && pendingOrderCount > 0 && (
                      <span className="min-w-5 h-5 px-1.5 rounded-full bg-white text-[#FF5500] text-[10px] font-bold flex items-center justify-center">
                        {pendingOrderCount > 99 ? '99+' : pendingOrderCount}
                      </span>
                    )}
                    {item.access === 'admin' && !isActive && (
                      <Lock className="w-3 h-3 text-white/20 flex-shrink-0" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom links - Pinned Bottom */}
      <div className="p-3 border-t border-white/10 space-y-0.5 flex-shrink-0">
        <Link
          to="/"
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-white/45 hover:bg-white/6 hover:text-white transition-colors text-sm font-medium"
        >
          <Home className="w-[18px] h-[18px]" />
          Back to Site
        </Link>
        <button
          type="button"
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-white/45 hover:bg-red-500/15 hover:text-red-400 transition-colors text-sm font-medium"
        >
          <LogOut className="w-[18px] h-[18px]" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-[#0F0A1E] font-sans relative">
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile sidebar drawer */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-y-0 left-0 z-50 w-72 shadow-2xl lg:hidden"
            data-lenis-prevent
          >
            <Sidebar />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop sidebar - fixed 100vh height locked to left screen edge */}
      <aside
        className="hidden lg:flex fixed top-0 left-0 bottom-0 z-30 w-64 xl:w-72 flex-col h-screen border-r border-white/10 shadow-2xl bg-[#1A1028]"
        data-lenis-prevent
      >
        <Sidebar />
      </aside>

      {/* Main content area - offsets by sidebar width & uses natural page scroll */}
      <div className="w-full min-h-screen lg:pl-64 xl:pl-72 flex flex-col">
        {/* Top bar - TaskHive Header Bar Style */}
        <header className="h-20 sticky top-0 z-30 bg-[#F8F9FD] dark:bg-[#150D24] border-b border-slate-200/60 dark:border-white/8 flex items-center px-4 lg:px-8 gap-4 justify-between backdrop-blur-md">
          {/* Left Title / Heading */}
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden text-slate-600 dark:text-white/60 hover:text-[#FF5500] transition-colors p-2"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {getPageTitle()}
            </h1>
          </div>

          {/* Right Actions: Search Pill (Search Icon on Right) + Interactive Calendar Picker + Bell + Profile */}
          <div className="flex items-center gap-3">
            {/* Search bar pill shifted right - Search icon on RIGHT side */}
            <div
              onClick={() => setSearchOpen(true)}
              className="hidden sm:flex relative w-56 md:w-64 lg:w-72 xl:w-80 h-11 bg-white dark:bg-white/8 border border-slate-200/80 dark:border-white/10 rounded-2xl px-4 items-center justify-between shadow-xs hover:border-[#FF5500]/50 transition-all cursor-pointer group"
            >
              <span className="bg-transparent text-xs text-slate-400 dark:text-white/40 font-medium truncate pr-2">
                Search projects, products, vendors...
              </span>
              <Search className="w-4 h-4 text-slate-400 dark:text-white/30 group-hover:text-[#FF5500] transition-colors flex-shrink-0" />
            </div>

            {/* Interactive Calendar Picker Popover */}
            <Popover>
              <PopoverTrigger asChild>
                <div className="hidden md:flex items-center gap-2 h-11 bg-white dark:bg-white/8 border border-slate-200/80 dark:border-white/10 rounded-2xl px-4 text-xs font-semibold text-slate-700 dark:text-white/90 shadow-xs hover:border-[#FF5500]/30 transition-all cursor-pointer">
                  <CalendarIcon className="w-4 h-4 text-[#FF5500] flex-shrink-0" />
                  <span>{formattedDateRange}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                </div>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-auto p-3 bg-white dark:bg-[#1A1028] border-slate-200 dark:border-white/10 shadow-2xl rounded-3xl space-y-3">
                <div className="flex items-center justify-between px-2 pt-1">
                  <span className="font-bold text-slate-900 dark:text-white text-sm">Select Date Range</span>
                  <span className="text-[10px] font-bold text-[#FF5500] bg-[#FF5500]/10 px-2 py-0.5 rounded-full">Calendar</span>
                </div>
                
                <UICalendar
                  initialFocus
                  mode="range"
                  defaultMonth={selectedDateRange?.from}
                  selected={selectedDateRange}
                  onSelect={setSelectedDateRange}
                  numberOfMonths={1}
                  className="rounded-2xl border border-slate-100 dark:border-white/10 p-2"
                />

                {/* Preset Quick Buttons */}
                <div className="grid grid-cols-2 gap-1.5 pt-1 text-xs">
                  <button
                    onClick={() => setSelectedDateRange({ from: new Date(), to: new Date() })}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-white/8 text-slate-700 dark:text-white/80 hover:bg-[#FF5500] hover:text-white transition-colors font-medium text-center"
                  >
                    Today
                  </button>
                  <button
                    onClick={() => setSelectedDateRange({ from: new Date(Date.now() - 7 * 86400000), to: new Date() })}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-white/8 text-slate-700 dark:text-white/80 hover:bg-[#FF5500] hover:text-white transition-colors font-medium text-center"
                  >
                    Last 7 Days
                  </button>
                  <button
                    onClick={() => setSelectedDateRange({ from: new Date(Date.now() - 30 * 86400000), to: new Date() })}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-white/8 text-slate-700 dark:text-white/80 hover:bg-[#FF5500] hover:text-white transition-colors font-medium text-center"
                  >
                    Last 30 Days
                  </button>
                  <button
                    onClick={() => setSelectedDateRange({ from: new Date(new Date().getFullYear(), new Date().getMonth(), 1), to: new Date() })}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-white/8 text-slate-700 dark:text-white/80 hover:bg-[#FF5500] hover:text-white transition-colors font-medium text-center"
                  >
                    This Month
                  </button>
                </div>
              </PopoverContent>
            </Popover>

            {/* Notification bell pill - Functional Pending Orders Dropdown */}
            {shouldEnableRealtime && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="relative w-11 h-11 bg-white dark:bg-white/8 border border-slate-200/80 dark:border-white/10 rounded-2xl flex items-center justify-center text-slate-600 dark:text-white/80 hover:text-[#FF5500] hover:border-[#FF5500]/30 shadow-xs transition-all flex-shrink-0 cursor-pointer"
                    aria-label="Pending orders"
                  >
                    <Bell className="w-4.5 h-4.5" />
                    {pendingOrderCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[20px] h-[20px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white dark:border-[#150D24] shadow-sm">
                        {pendingOrderCount > 99 ? '99+' : pendingOrderCount}
                      </span>
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 bg-white dark:bg-[#1A1028] border-slate-200 dark:border-white/10 shadow-xl rounded-2xl p-2 text-xs">
                  <div className="flex items-center justify-between px-2 py-1.5 mb-1">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">Notifications</span>
                    <span className="bg-[#FF5500]/10 text-[#FF5500] font-bold text-[10px] px-2.5 py-0.5 rounded-full">{pendingOrderCount} Pending</span>
                  </div>
                  <DropdownMenuSeparator className="bg-slate-100 dark:bg-white/10" />
                  {orders.length > 0 ? (
                    orders.slice(0, 4).map(o => (
                      <DropdownMenuItem key={o.id} onClick={() => navigate('/admin/orders')} className="cursor-pointer rounded-xl p-2.5 my-1 flex flex-col items-start gap-1 hover:bg-slate-50 dark:hover:bg-white/5">
                        <div className="flex items-center justify-between w-full">
                          <span className="font-bold text-slate-900 dark:text-white">Order #{o.id.slice(0, 8)}</span>
                          <span className="text-[10px] text-slate-400">{new Date(o.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-white/60">Status: <span className="capitalize font-semibold text-[#FF5500]">{o.status}</span> · Total: {currencySymbol}{o.total_amount}</p>
                      </DropdownMenuItem>
                    ))
                  ) : (
                    <div className="p-4 text-center text-slate-400 dark:text-white/40">No pending notifications</div>
                  )}
                  <DropdownMenuSeparator className="bg-slate-100 dark:bg-white/10" />
                  <DropdownMenuItem onClick={() => navigate('/admin/orders')} className="cursor-pointer rounded-xl p-2 text-center text-[#FF5500] font-bold justify-center">
                    View All Orders →
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* User Profile Pill - Functional User Account Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-3 h-11 bg-white dark:bg-white/8 border border-slate-200/80 dark:border-white/10 rounded-2xl pl-1.5 pr-4 shadow-xs hover:border-[#FF5500]/30 transition-all flex-shrink-0 cursor-pointer">
                  <Avatar className="w-8 h-8 border border-slate-200 dark:border-white/20">
                    <AvatarImage src={getOptimizedImageUrl(profile?.avatar_url || '', 80)} className="object-cover" />
                    <AvatarFallback className="bg-[#FF5500] text-white font-bold text-xs">
                      {user?.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                      {profile?.full_name || user?.email?.split('@')[0]}
                    </p>
                    <p className="text-[10px] font-semibold text-slate-400 dark:text-white/40 leading-tight capitalize">
                      {getRoleLabel()}
                    </p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-white/30 hidden sm:block flex-shrink-0" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-[#1A1028] border-slate-200 dark:border-white/10 shadow-xl rounded-2xl p-1.5 text-xs">
                <DropdownMenuLabel className="text-slate-900 dark:text-white font-bold px-2 py-1">My Account</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-slate-100 dark:bg-white/10" />
                <DropdownMenuItem onClick={() => navigate('/admin/profile')} className="cursor-pointer rounded-xl font-medium py-2 flex items-center gap-2">
                  <User className="w-4 h-4 text-[#FF5500]" />
                  <span>My Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/')} className="cursor-pointer rounded-xl font-medium py-2 flex items-center gap-2">
                  <Home className="w-4 h-4 text-emerald-500" />
                  <span>Store Front</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/admin/settings')} className="cursor-pointer rounded-xl font-medium py-2 flex items-center gap-2">
                  <Settings className="w-4 h-4 text-indigo-500" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-slate-100 dark:bg-white/10" />
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer rounded-xl font-medium py-2 text-red-500 hover:text-red-600 flex items-center gap-2">
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Global Search Dialog Modal */}
        <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
          <DialogContent className="sm:max-w-xl bg-white dark:bg-[#1A1028] border-slate-200 dark:border-white/10 p-0 rounded-3xl overflow-hidden shadow-2xl">
            <DialogHeader className="p-4 border-b border-slate-100 dark:border-white/10">
              <DialogTitle className="sr-only">Global Search</DialogTitle>
              <div className="flex items-center gap-3">
                <Search className="w-5 h-5 text-[#FF5500]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products, orders, navigation..."
                  className="w-full bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/40 focus:outline-none font-medium"
                  autoFocus
                />
              </div>
            </DialogHeader>

            <div className="p-3 max-h-96 overflow-y-auto no-scrollbar space-y-1">
              {searchQuery.trim() === '' ? (
                <div className="p-6 text-center text-xs text-slate-400 dark:text-white/40 space-y-1">
                  <p className="font-semibold text-slate-600 dark:text-white/70">Type to search across OFLEX Studio</p>
                  <p>Search products, customer orders, or admin navigation pages</p>
                </div>
              ) : filteredSearchItems.length > 0 ? (
                filteredSearchItems.map(item => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setSearchOpen(false);
                      navigate(item.path);
                    }}
                    className="flex items-center justify-between p-3 rounded-2xl cursor-pointer hover:bg-slate-100 dark:hover:bg-white/8 transition-colors group"
                  >
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white text-sm group-hover:text-[#FF5500] transition-colors">{item.title}</p>
                      <p className="text-xs text-slate-400 dark:text-white/40">{item.subtitle}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/30 bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded-full">{item.type}</span>
                      <ArrowRight className="w-4 h-4 text-slate-300 dark:text-white/20 group-hover:text-[#FF5500] transition-colors" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-slate-400 dark:text-white/40">
                  No matching items found for "{searchQuery}"
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1700px] mx-auto w-full space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
};
