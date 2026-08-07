import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Search, Shield, UserCog, ShoppingCart, ShoppingBag, User, LogOut } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, Minus, Trash2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { getOptimizedImageUrl } from '@/lib/image-optimizer';
import { useProfile } from '@/hooks/useUsers';


const navLinks = [
  { name: 'Home', path: '/' },
  { name: 'About', path: '/about' },
  { name: 'Services', path: '/services' },
  { name: 'Projects', path: '/portfolio' },
  { name: 'News', path: '/blog' },
  { name: 'Contact', path: '/contact' },
];

interface Product {
  id: string;
  title: string;
  price: number;
  image_url: string | null;
}

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  product?: Product;
}

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { theme } = useTheme();
  const { user, signOut, isAdmin, isModerator, isAuthReady } = useAuth();
  const { getSetting } = useSiteSettings();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: profile } = useProfile(user?.id);

  const { isLoading: settingsLoading } = useSiteSettings();
  const logoUrl = getSetting('logo_url', '');

  // Fetch products for cart
  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;
      return data as Product[];
    },
  });

  // Fetch cart items
  const { data: cartItems = [] } = useQuery({
    queryKey: ['cart', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          *,
          product:products(*)
        `)
        .eq('user_id', user.id);

      if (error) throw error;
      return data as CartItem[];
    },
    enabled: isAuthReady && !!user,
  });

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cartItems.reduce(
    (sum, item) => sum + (item.product?.price || 0) * item.quantity,
    0
  );

  // Update quantity mutation
  const updateQuantityMutation = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      if (!user) return;
      if (quantity <= 0) {
        await supabase.from('cart_items').delete().eq('id', itemId);
      } else {
        await supabase.from('cart_items').update({ quantity }).eq('id', itemId);
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
  });

  // Remove from cart
  const removeFromCartMutation = useMutation({
    mutationFn: async (itemId: string) => {
      if (!user) return;
      await supabase.from('cart_items').delete().eq('id', itemId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast({ title: 'Removed from cart' });
    },
  });


  const handleSignOut = async () => {
    try {
      await signOut();
      toast({ title: 'Signed out successfully' });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      navigate('/');
    }
  };

  const userInitials = user?.email?.slice(0, 2).toUpperCase() || 'U';

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 glass-panel shadow-sm"
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <motion.img
              src={theme === 'dark' 
                ? (getSetting('logo_white_url') || getSetting('logo_dark_url') || "/logo-white.png")
                : (getSetting('logo_url') || "/logo.png")
              }
              alt={getSetting('site_name', 'Oflex Creative')}
              className="h-12 md:h-16 w-auto object-contain"
              loading="eager"
              decoding="sync"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            />
          </Link>

          {/* Desktop Nav & Actions Group */}
          <div className="hidden lg:flex items-center gap-8 xl:gap-12">
            {/* Desktop Navigation */}
            <div className="flex items-center gap-5">
              {navLinks.map((link) => (
                <Link key={link.path} to={link.path} className="relative group">
                  <span className={`text-[15px] uppercase font-bold tracking-wider transition-colors ${location.pathname === link.path
                    ? 'text-primary'
                    : 'text-black dark:text-white hover:text-primary'
                    }`}>
                    {link.name}
                  </span>
                  {location.pathname === link.path && (
                    <motion.div
                      layoutId="navbar-indicator"
                      className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary rounded-full"
                    />
                  )}
                </Link>
              ))}
            </div>

            {/* Desktop Actions */}
            <div className="flex items-center gap-3 ml-6 lg:ml-10">
              <Button variant="ghost" size="icon" onClick={() => setIsSearchOpen(true)} className="rounded-none" aria-label="Search">
                <Search className="w-5 h-5" />
              </Button>

              {/* Store Icon */}
              <Button variant="ghost" size="icon" className="rounded-none" asChild>
                <Link to="/store" title="Store">
                  <ShoppingBag className="w-5 h-5" />
                </Link>
              </Button>

              {/* Cart */}
              <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative rounded-none">
                    <ShoppingCart className="w-6 h-6" />
                    {cartCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                        {cartCount}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-full sm:max-w-lg flex flex-col">
                  <SheetHeader>
                    <SheetTitle>Shopping Cart ({cartCount} items)</SheetTitle>
                  </SheetHeader>
                  <div className="flex-1 flex flex-col mt-6 overflow-hidden">
                    {!user ? (
                      <div className="flex-1 flex flex-col items-center justify-center gap-4">
                        <p className="text-muted-foreground">Please login to view your cart</p>
                        <Button onClick={() => { setIsCartOpen(false); navigate('/auth'); }}>Login</Button>
                      </div>
                    ) : cartItems.length === 0 ? (
                      <div className="flex-1 flex items-center justify-center">
                        <p className="text-muted-foreground">Your cart is empty</p>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1 overflow-auto space-y-4 pr-2">
                          {cartItems.map((item) => (
                            <div key={item.id} className="flex gap-4 p-4 border border-border rounded-lg bg-card">
                              {item.product?.image_url && (
                                <img src={item.product.image_url} alt={item.product.title} className="w-16 h-16 object-cover rounded-md" />
                              )}
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-foreground truncate">{item.product?.title}</h4>
                                <p className="text-sm text-muted-foreground">${item.product?.price?.toFixed(2)}</p>
                                <div className="flex items-center gap-2 mt-2">
                                  <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantityMutation.mutate({ itemId: item.id, quantity: item.quantity - 1 })}>
                                    <Minus className="h-3 w-3" />
                                  </Button>
                                  <span className="w-6 text-center text-sm text-foreground">{item.quantity}</span>
                                  <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantityMutation.mutate({ itemId: item.id, quantity: item.quantity + 1 })}>
                                    <Plus className="h-3 w-3" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 ml-auto text-destructive hover:text-destructive" onClick={() => removeFromCartMutation.mutate(item.id)}>
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="border-t border-border pt-4 mt-4">
                          <div className="flex justify-between text-lg font-semibold mb-4 text-foreground">
                            <span>Total:</span>
                            <span>${cartTotal.toFixed(2)}</span>
                          </div>
                          <Button className="w-full rounded-none" size="lg" onClick={() => { setIsCartOpen(false); navigate('/checkout'); }}>
                            Proceed to Checkout
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </SheetContent>
              </Sheet>

              {/* User Account & Action Buttons */}
              {user ? (
                <>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-full">
                        <Avatar className="h-9 w-9 border-2 border-primary rounded-full">
                          <AvatarImage src={getOptimizedImageUrl(profile?.avatar_url || '', 100)} className="object-cover" />
                          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                            {userInitials}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => navigate('/profile')}>
                        <User className="w-4 h-4 mr-2" />
                        Profile
                      </DropdownMenuItem>
                      {(isAdmin || isModerator) && (
                        <DropdownMenuItem onClick={() => navigate('/admin')}>
                          {isAdmin ? <Shield className="w-4 h-4 mr-2" /> : <UserCog className="w-4 h-4 mr-2" />}
                          {isAdmin ? 'Admin Dashboard' : 'Moderator Dashboard'}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSignOut}>
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Button asChild size="sm" className="h-10 px-5 rounded-none font-bold text-sm uppercase tracking-wide shadow-md hover:scale-105 transition-transform">
                    <Link to="/contact">Get In Touch</Link>
                  </Button>
                </>
              ) : (
                <Button asChild size="sm" className="h-10 px-5 rounded-none font-bold text-sm uppercase tracking-wide shadow-md hover:scale-105 transition-transform">
                  <Link to="/auth">Sign In</Link>
                </Button>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden items-center gap-1 sm:gap-2">
            {/* Mobile Store Icon */}
            <Button variant="ghost" size="icon" className="rounded-none" asChild>
              <Link to="/store" title="Store">
                <ShoppingBag className="w-5 h-5" />
              </Link>
            </Button>

            {/* Mobile Cart */}
            <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="relative rounded-none">
                  <ShoppingCart className="w-5 h-5" />
                  {cartCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                      {cartCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
            </Sheet>

            <Button variant="ghost" size="icon" onClick={() => setIsSearchOpen(true)} className="rounded-none" aria-label="Search">
              <Search className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)}>
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-background border-b border-border overflow-hidden"
          >
            <div className="container mx-auto px-4 py-4 flex flex-col gap-2">
              {navLinks.map((link, index) => (
                <motion.div
                  key={link.path}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    to={link.path}
                    onClick={() => setIsOpen(false)}
                    className={`block py-3 px-4 rounded-lg transition-colors text-[14px] uppercase font-bold tracking-wider ${location.pathname === link.path
                      ? 'bg-primary text-primary-foreground'
                      : 'text-black dark:text-white hover:bg-muted hover:text-primary'
                      }`}
                  >
                    {link.name}
                  </Link>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: navLinks.length * 0.05 }}
                className="pt-2"
              >
                {user ? (
                  <div className="space-y-2">
                    <Button asChild className="w-full rounded-none font-bold uppercase tracking-wide">
                      <Link to="/contact" onClick={() => setIsOpen(false)}>Get In Touch</Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full h-12 rounded-none">
                      <Link to="/profile" onClick={() => setIsOpen(false)} className="flex items-center justify-center gap-3">
                        <Avatar className="h-6 w-6 border-2 border-primary rounded-full">
                          <AvatarImage src={getOptimizedImageUrl(profile?.avatar_url || '', 50)} className="object-cover" />
                          <AvatarFallback className="text-[10px]">
                            {userInitials}
                          </AvatarFallback>
                        </Avatar>
                        Profile
                      </Link>
                    </Button>
                    {(isAdmin || isModerator) && (
                      <Button asChild variant="outline" className="w-full rounded-none">
                        <Link to="/admin" onClick={() => setIsOpen(false)}>
                          {isAdmin ? <Shield className="w-4 h-4 mr-2" /> : <UserCog className="w-4 h-4 mr-2" />}
                          {isAdmin ? 'Admin Dashboard' : 'Moderator Dashboard'}
                        </Link>
                      </Button>
                    )}
                    <Button variant="secondary" className="w-full rounded-none" onClick={() => { handleSignOut(); setIsOpen(false); }}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>
                ) : (
                  <Button asChild className="w-full rounded-none font-bold uppercase tracking-wide">
                    <Link to="/auth" onClick={() => setIsOpen(false)}>Sign In</Link>
                  </Button>
                )}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Search Dialog - Positioned Top & Modern Design */}
      <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
        <DialogContent className="fixed left-[50%] -translate-x-[50%] top-4 sm:top-12 translate-y-0 z-50 w-[94vw] max-w-2xl p-5 sm:p-7 bg-white dark:bg-card rounded-[28px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.2)] border border-slate-100 dark:border-border/80 outline-none">
          <div className="flex flex-col gap-6">
            {/* Search Input Bar matching screenshot */}
            <div className="flex items-center w-full border border-slate-200 dark:border-border rounded-full p-1.5 pl-5 bg-slate-50/50 dark:bg-muted/40 focus-within:bg-white dark:focus-within:bg-card focus-within:border-primary/80 focus-within:ring-2 focus-within:ring-primary/20 transition-all shadow-inner">
              <Search className="w-5 h-5 text-slate-400 dark:text-muted-foreground mr-3 shrink-0" />
              <input
                type="text"
                placeholder="Search products, brands and categories"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    setIsSearchOpen(false);
                    navigate(`/store?search=${encodeURIComponent(searchQuery.trim())}`);
                    setSearchQuery('');
                  }
                }}
                className="w-full bg-transparent border-none outline-none text-foreground placeholder:text-slate-400 dark:placeholder:text-muted-foreground text-sm sm:text-base font-medium"
              />
              <Button
                onClick={() => {
                  if (searchQuery.trim()) {
                    setIsSearchOpen(false);
                    navigate(`/store?search=${encodeURIComponent(searchQuery.trim())}`);
                    setSearchQuery('');
                  }
                }}
                className="bg-[#FF5500] hover:bg-[#E04B00] text-white font-bold rounded-full px-6 py-2.5 h-auto text-sm shrink-0 ml-2 shadow-md transition-transform active:scale-95 border-none"
              >
                Search
              </Button>
            </div>

            {/* Trending Searches section matching screenshot */}
            <div>
              <span className="text-[11px] font-extrabold tracking-widest text-slate-400 dark:text-muted-foreground uppercase mb-3 block">
                TRENDING SEARCHES
              </span>
              <div className="flex flex-wrap gap-2 sm:gap-2.5">
                {[
                  'web design',
                  'templates',
                  'power banks',
                  'watch',
                  'branding',
                  'laptop',
                  'iPhone 15',
                  'sneakers',
                  'UI/UX'
                ].map((term) => (
                  <button
                    key={term}
                    onClick={() => {
                      setIsSearchOpen(false);
                      navigate(`/store?search=${encodeURIComponent(term)}`);
                    }}
                    className="px-4 py-2 rounded-full bg-slate-100 dark:bg-muted text-slate-700 dark:text-foreground text-xs sm:text-sm font-medium hover:bg-[#FF5500] hover:text-white dark:hover:bg-[#FF5500] dark:hover:text-white transition-all cursor-pointer shadow-2xs"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.nav>
  );
};