import { ReactNode, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Home,
  Image as ImageIcon,
  Briefcase,
  Palette,
  MessageSquare,
  HelpCircle,
  Layers,
  Lock,
  Shield,
  UserCog,
  Mail,
  Bell,
  Star,
  Zap,
  Handshake,
  Info,
  Layout,
  Store,
  FileText,
  Sparkles,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { useRealtimeOrders } from '@/hooks/useRealtimeOrders';
import { useAdminStats } from '@/hooks/useAdminStats';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useProfile } from '@/hooks/useUsers';
import { getOptimizedImageUrl } from '@/lib/image-optimizer';

interface AdminLayoutProps {
  children: ReactNode;
}

// Define nav items with access level: 'admin' = admin only, 'moderator' = admin + moderator
const navItems = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard, access: 'moderator' },
  { path: '/admin/hero-slides', label: 'Hero Slides', icon: Layers, access: 'moderator' },

  { path: '/admin/featured-projects', label: 'Featured Projects', icon: Star, access: 'moderator' },
  { path: '/admin/portfolio', label: 'Portfolio', icon: Briefcase, access: 'moderator' },
  { path: '/admin/services', label: 'Services', icon: Sparkles, access: 'moderator' },
  { path: '/admin/products', label: 'Products', icon: Package, access: 'moderator' },
  { path: '/admin/testimonials', label: 'Testimonials', icon: MessageSquare, access: 'moderator' },
  { path: '/admin/faqs', label: 'FAQs', icon: HelpCircle, access: 'moderator' },
  { path: '/admin/about', label: 'About Page', icon: Info, access: 'moderator' },
  { path: '/admin/trusted-partners', label: 'Trusted Partners', icon: Handshake, access: 'moderator' },
  { path: '/admin/blog-posts', label: 'Blog Posts', icon: FileText, access: 'moderator' },
  { path: '/admin/newsletter', label: 'Newsletter', icon: Mail, access: 'moderator' },
  { path: '/admin/orders', label: 'Orders', icon: ShoppingCart, access: 'moderator' },
  { path: '/admin/messages', label: 'Contact Messages', icon: MessageSquare, access: 'moderator' },
  { path: '/admin/users', label: 'User Management', icon: Users, access: 'admin' },
  { path: '/admin/customization', label: 'Customization', icon: Palette, access: 'admin' },
  { path: '/admin/settings', label: 'Settings', icon: Settings, access: 'admin' },
  { path: '/admin/profile', label: 'My Profile', icon: User, access: 'moderator' },
];

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { signOut, user, isAdmin, isModerator, userRole } = useAuth();
  const { getSetting } = useSiteSettings();
  const { data: adminStats } = useAdminStats();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: profile } = useProfile(user?.id);
  const logoUrl = getSetting('logo_url', '');

  const shouldEnableRealtime = isAdmin || isModerator;

  const pendingOrderCount = adminStats?.pending_orders || 0;

  // Optimize real-time orders by adding caching and reducing redundant updates
  useRealtimeOrders({
    enabled: shouldEnableRealtime,
  });

  const handleSignOut = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    try {
      await signOut();
    } catch (error) {
      console.error("Logout failed", error);
    } finally {
      navigate('/auth');
    }
  };

  // Filter nav items based on user role
  const accessibleNavItems = navItems.filter((item) => {
    if (isAdmin) return true; // Admin can see everything
    if (isModerator && item.access === 'moderator') return true;
    return false;
  });

  const getRoleIcon = () => {
    if (isAdmin) return <Shield className="w-3 h-3" />;
    if (isModerator) return <UserCog className="w-3 h-3" />;
    return null;
  };

  const getRoleBadge = () => {
    if (isAdmin) return 'Admin';
    if (isModerator) return 'Moderator';
    return 'User';
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-card/80 backdrop-blur-xl border-r border-border/10 transform transition-transform duration-300 ease-in-out shadow-2xl lg:shadow-none ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-border flex items-center justify-between">
            <Link to="/admin" className="flex items-center">
              <img src={logoUrl || ""} alt="Admin" className="h-8 w-auto" />
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Navigation - Scrollable */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {accessibleNavItems.map((item) => {
              const isActive = location.pathname === item.path;
              const isAdminOnly = item.access === 'admin';
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                    : 'text-muted-foreground hover:bg-primary/5 hover:text-primary'
                    }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute left-0 w-1 h-6 bg-primary-foreground/50 rounded-full"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <item.icon className="w-5 h-5" />
                  <span className="flex-1">{item.label}</span>
                  {item.path === '/admin/orders' && pendingOrderCount > 0 && (
                    <Badge variant="default" className="ml-auto text-[10px] px-1.5 h-5 bg-primary-foreground text-primary">
                      {pendingOrderCount}
                    </Badge>
                  )}
                  {isAdminOnly && !isActive && (
                    <Lock className="w-3 h-3 text-muted-foreground/50" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Bottom section */}
          <div className="p-4 border-t border-border space-y-2">
            <Link
              to="/"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <Home className="w-5 h-5" />
              Back to Site
            </Link>
            <button
              type="button"
              onClick={(e) => handleSignOut(e)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        {/* Top bar */}
        <header className="h-16 sticky top-0 z-30 border-b border-border/10 bg-card/70 backdrop-blur-md flex items-center px-4 lg:px-8 gap-2 sm:gap-4 transition-all duration-300">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden flex-shrink-0 hover:bg-primary/5 rounded-full w-10 h-10"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5 text-primary" />
          </Button>
          <div className="flex-1 min-w-0" />
          <div className="flex items-center gap-1.5 sm:gap-3">
            {shouldEnableRealtime && (
              <Button
                variant="ghost"
                size="icon"
                className="relative flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10"
                onClick={() => navigate('/admin/orders')}
                aria-label="View pending orders"
              >
                <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                {pendingOrderCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-4 h-4 sm:min-w-5 sm:h-5 px-1 rounded-full bg-primary text-primary-foreground text-[9px] sm:text-[11px] flex items-center justify-center font-bold">
                    {pendingOrderCount > 99 ? '99+' : pendingOrderCount}
                  </span>
                )}
              </Button>
            )}
            <Badge variant="outline" className="flex items-center gap-1 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 font-bold">
              {getRoleIcon()}
              <span>{getRoleBadge()}</span>
            </Badge>
            <Link to="/admin/profile" className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity">
              <span className="text-sm text-muted-foreground hidden lg:block truncate max-w-[150px]">
                {user?.email}
              </span>
              <div className="w-8 h-8 sm:w-9 sm:h-9 flex-shrink-0">
                <Avatar className="w-full h-full border-2 border-primary bg-background shadow-lg shadow-primary/20">
                  <AvatarImage src={getOptimizedImageUrl(profile?.avatar_url || '', 100)} className="object-cover" />
                  <AvatarFallback className="bg-primary flex items-center justify-center text-primary-foreground font-black text-xs sm:text-sm">
                    {user?.email?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-3 sm:p-6 lg:p-10 max-w-[1600px] mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
};
