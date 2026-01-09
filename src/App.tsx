import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import About from "./pages/About";
import Services from "./pages/Services";
import Portfolio from "./pages/Portfolio";
import Store from "./pages/Store";
import Contact from "./pages/Contact";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import Checkout from "./pages/Checkout";
import Dashboard from "./pages/admin/Dashboard";
import Products from "./pages/admin/Products";
import FeaturedProjects from "./pages/admin/FeaturedProjects";
import AdminServices from "./pages/admin/Services";
import SiteCustomization from "./pages/admin/SiteCustomization";
import Orders from "./pages/admin/Orders";
import Users from "./pages/admin/Users";
import Settings from "./pages/admin/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/about" element={<About />} />
              <Route path="/services" element={<Services />} />
              <Route path="/portfolio" element={<Portfolio />} />
              <Route path="/store" element={<Store />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/admin" element={<Dashboard />} />
              <Route path="/admin/featured-projects" element={<FeaturedProjects />} />
              <Route path="/admin/services" element={<AdminServices />} />
              <Route path="/admin/products" element={<Products />} />
              <Route path="/admin/customization" element={<SiteCustomization />} />
              <Route path="/admin/orders" element={<Orders />} />
              <Route path="/admin/users" element={<Users />} />
              <Route path="/admin/settings" element={<Settings />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
