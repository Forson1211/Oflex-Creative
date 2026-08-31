import { useState, useEffect, Suspense, lazy } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { SecurityCheck } from "@/components/auth/SecurityCheck";
import { MaintenanceGuard } from "@/components/layout/MaintenanceGuard";
import { HelmetProvider } from 'react-helmet-async';
import { SEO } from "@/components/layout/SEO";
import { ScrollToTop } from "@/components/layout/ScrollToTop";
import { SmoothScroll } from "@/components/layout/SmoothScroll";
import { WhatsAppWidget } from "@/components/layout/WhatsAppWidget";
import { SiteSettingsProvider } from "@/hooks/useSiteSettings";

// Lazy load pages for faster initial load
const Index = lazy(() => import("./pages/Index"));
const About = lazy(() => import("./pages/About"));
const Services = lazy(() => import("./pages/Services"));
const Portfolio = lazy(() => import("./pages/Portfolio"));
const Store = lazy(() => import("./pages/Store"));
const Contact = lazy(() => import("./pages/Contact"));
const Auth = lazy(() => import("./pages/Auth"));
const Profile = lazy(() => import("./pages/Profile"));
const Checkout = lazy(() => import("./pages/Checkout"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const OrderDetail = lazy(() => import("./pages/OrderDetails"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPostDetail = lazy(() => import("./pages/BlogPostDetail"));
const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
const Products = lazy(() => import("./pages/admin/Products"));
const FeaturedProjects = lazy(() => import("./pages/admin/FeaturedProjects"));
const AdminServices = lazy(() => import("./pages/admin/Services"));
const AdminPortfolio = lazy(() => import("./pages/admin/Portfolio"));
const HeroSlides = lazy(() => import("./pages/admin/HeroSlides"));

const SiteCustomization = lazy(() => import("./pages/admin/SiteCustomization"));
const Testimonials = lazy(() => import("./pages/admin/Testimonials"));
const FAQs = lazy(() => import("./pages/admin/FAQs"));
const AboutPage = lazy(() => import("./pages/admin/AboutPage"));
const TrustedPartners = lazy(() => import("./pages/admin/TrustedPartners"));
const Orders = lazy(() => import("./pages/admin/Orders"));
const Users = lazy(() => import("./pages/admin/Users"));
const Settings = lazy(() => import("./pages/admin/Settings"));
const AdminProfile = lazy(() => import("./pages/admin/Profile"));
const ContactMessages = lazy(() => import("./pages/admin/ContactMessages"));
const BlogPosts = lazy(() => import("./pages/admin/BlogPosts"));
const NewsletterSubscribers = lazy(() => import("./pages/admin/NewsletterSubscribers"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AccessDenied = lazy(() => import("./pages/AccessDenied"));
const Maintenance = lazy(() => import("./pages/Maintenance"));

const AuthStatusHandler = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace('#', '?'));

    const hasAuthParams = params.has('code') ||
      hashParams.has('access_token') ||
      hashParams.has('refresh_token');

    const error = params.get('error') || hashParams.get('error');
    const description = params.get('error_description') || hashParams.get('error_description');
    const code = params.get('error_code') || hashParams.get('error_code');
    const signupSuccess = params.get('signup_success');

    if (error) {
      const isExpired = code === 'otp_expired' || description?.includes('expired') || error.includes('expired');

      toast({
        title: isExpired ? "Verification Link Expired" : "Authentication Error",
        description: isExpired
          ? "This link has already been used or has expired. Please sign in to receive a new one."
          : description?.replace(/\+/g, ' ') || `An error occurred: ${error}`,
        variant: "destructive",
      });

      if (isExpired) {
        setTimeout(() => navigate('/auth'), 2000);
      }
    } else if (signupSuccess) {
      toast({
        title: "Account Confirmed!",
        description: "Your email has been verified. Welcome to Oflex Creative Studio!",
      });
    }

    const isResettingPassword = params.has('update_password') ||
      params.get('type') === 'recovery' ||
      hashParams.get('type') === 'recovery';

    if (!hasAuthParams && !isResettingPassword && (error || signupSuccess)) {
      const url = new URL(window.location.href);
      url.search = '';
      url.hash = '';
      window.history.replaceState({}, '', url.toString());
    }
  }, [toast, navigate, user]);

  return null;
};

const AppContent = () => {
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Eagerly prefetch essential route code and database queries in background
    const prefetch = () => {
      const nav = navigator as any;
      if (nav.connection && (nav.connection.saveData || /(2g|3g)/.test(nav.connection.effectiveType))) {
        return;
      }

      const routes = [
        () => import("./pages/Index"),
        () => import("./pages/Store"),
        () => import("./pages/Portfolio"),
        () => import("./pages/Services"),
        () => import("./pages/Blog"),
        () => import("./pages/About"),
        () => import("./pages/Contact"),
      ];

      routes.forEach((route, i) => {
        setTimeout(() => void route(), i * 150);
      });
    };

    prefetch();
  }, []);

  return (
    <>
      {/* Loading Overlay rendered on top of App content so App mounts and pre-renders completely behind the scenes */}
      <AnimatePresence>
        {isInitialLoading && (
          <motion.div
            key="loading-overlay"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="fixed inset-0 z-[99999]"
          >
            <LoadingScreen />
          </motion.div>
        )}
      </AnimatePresence>

      <Suspense fallback={<LoadingScreen />}>
        <SmoothScroll />
        <ScrollToTop />
        <SEO />
        <WhatsAppWidget />
        <AuthStatusHandler />
        <MaintenanceGuard>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/about" element={<About />} />
            <Route path="/services" element={<Services />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/store" element={<Store />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/order/:id" element={<OrderDetail />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:id" element={<BlogPostDetail />} />
            <Route path="/admin" element={<Dashboard />} />
            <Route path="/admin/hero-slides" element={<HeroSlides />} />

            <Route path="/admin/featured-projects" element={<FeaturedProjects />} />
            <Route path="/admin/portfolio" element={<AdminPortfolio />} />
            <Route path="/admin/services" element={<AdminServices />} />
            <Route path="/admin/products" element={<Products />} />
            <Route path="/admin/testimonials" element={<Testimonials />} />
            <Route path="/admin/faqs" element={<FAQs />} />
            <Route path="/admin/about" element={<AboutPage />} />
            <Route path="/admin/trusted-partners" element={<TrustedPartners />} />
            <Route path="/admin/customization" element={<SiteCustomization />} />
            <Route path="/admin/orders" element={<Orders />} />
            <Route path="/admin/users" element={<Users />} />
            <Route path="/admin/settings" element={<Settings />} />
            <Route path="/admin/profile" element={<AdminProfile />} />
            <Route path="/admin/messages" element={<ContactMessages />} />
            <Route path="/admin/blog-posts" element={<BlogPosts />} />
            <Route path="/admin/newsletter" element={<NewsletterSubscribers />} />
            <Route path="/access-denied" element={<AccessDenied />} />
            <Route path="/maintenance" element={<Maintenance />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </MaintenanceGuard>
      </Suspense>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <AuthProvider>
        <SecurityCheck>
          <ThemeProvider>
            <SiteSettingsProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter
                  future={{
                    v7_startTransition: true,
                    v7_relativeSplatPath: true,
                  }}
                >
                  <AppContent />
                </BrowserRouter>
              </TooltipProvider>
            </SiteSettingsProvider>
          </ThemeProvider>
        </SecurityCheck>
      </AuthProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
