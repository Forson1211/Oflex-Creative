import { useState, useEffect, Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/hooks/useAuth";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { SecurityCheck } from "@/components/auth/SecurityCheck";
import { MaintenanceGuard } from "@/components/layout/MaintenanceGuard";

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
const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
const Products = lazy(() => import("./pages/admin/Products"));
const FeaturedProjects = lazy(() => import("./pages/admin/FeaturedProjects"));
const AdminServices = lazy(() => import("./pages/admin/Services"));
const AdminPortfolio = lazy(() => import("./pages/admin/Portfolio"));
const HeroSlides = lazy(() => import("./pages/admin/HeroSlides"));
const StoreSlides = lazy(() => import("./pages/admin/StoreSlides"));
const SiteCustomization = lazy(() => import("./pages/admin/SiteCustomization"));
const Testimonials = lazy(() => import("./pages/admin/Testimonials"));
const FAQs = lazy(() => import("./pages/admin/FAQs"));
const AboutPage = lazy(() => import("./pages/admin/AboutPage"));
const TrustedPartners = lazy(() => import("./pages/admin/TrustedPartners"));
const Orders = lazy(() => import("./pages/admin/Orders"));
const Users = lazy(() => import("./pages/admin/Users"));
const Settings = lazy(() => import("./pages/admin/Settings"));
const ContactMessages = lazy(() => import("./pages/admin/ContactMessages"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Component to handle initial load vs navigation
const AppContent = () => {
  useEffect(() => {
    // Prefetch common routes in idle time to make navigation feel instant
    const prefetch = () => {
      void import("./pages/Store");
      void import("./pages/Portfolio");
      void import("./pages/Contact");
      void import("./pages/About");
      void import("./pages/Services");
      void import("./pages/Profile");
    };

    const w = globalThis as unknown as {
      requestIdleCallback?: (cb: () => void, opts?: { timeout?: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    let idleId: number;
    if (typeof w.requestIdleCallback === "function") {
      idleId = w.requestIdleCallback(prefetch, { timeout: 1500 });
    } else {
      idleId = setTimeout(prefetch, 2500) as unknown as number;
    }

    return () => {
      if (typeof w.cancelIdleCallback === "function") {
        w.cancelIdleCallback(idleId);
      } else {
        clearTimeout(idleId);
      }
    };
  }, []);

  return (
    <Suspense fallback={<LoadingScreen />}>
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
        <Route path="/admin" element={<Dashboard />} />
        <Route path="/admin/hero-slides" element={<HeroSlides />} />
        <Route path="/admin/store-slides" element={<StoreSlides />} />
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
        <Route path="/admin/contact-messages" element={<ContactMessages />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <SecurityCheck>
        <MaintenanceGuard>
          <ThemeProvider>
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
          </ThemeProvider>
        </MaintenanceGuard>
      </SecurityCheck>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
