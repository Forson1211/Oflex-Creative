import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Star, ShoppingBag, Users, TrendingUp } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";

type StatCardProps = {
  icon: React.ElementType;
  value: number | string;
  label: string;
  delay?: number;
};

function StatCard({ icon: Icon, value, label, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
      className="flex flex-col items-center gap-2 px-4 py-3"
    >
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div className="text-center">
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-xs opacity-80">{label}</div>
      </div>
    </motion.div>
  );
}

export function FooterSocialProof() {
  // Count active testimonials
  const { data: testimonialsCount = 0 } = useQuery({
    queryKey: ["testimonials-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("testimonials")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);
      if (error) throw error;
      return count || 0;
    },
  });

  // Count completed orders
  const { data: ordersCount = 0 } = useQuery({
    queryKey: ["orders-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("status", "completed");
      if (error) throw error;
      return count || 0;
    },
  });

  // Count total profiles (users)
  const { data: usersCount = 0 } = useQuery({
    queryKey: ["users-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      return count || 0;
    },
  });

  // Get total active products
  const { data: productsCount = 0 } = useQuery({
    queryKey: ["products-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);
      if (error) throw error;
      return count || 0;
    },
  });

  // Don't render if all counts are 0
  if (testimonialsCount === 0 && ordersCount === 0 && usersCount === 0 && productsCount === 0) {
    return null;
  }

  return (
    <div className="border-b border-white/10 bg-black/10">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
          <StatCard
            icon={Star}
            value={testimonialsCount}
            label="Happy Clients"
            delay={0}
          />
          <StatCard
            icon={ShoppingBag}
            value={ordersCount}
            label="Orders Completed"
            delay={0.1}
          />
          <StatCard
            icon={Users}
            value={usersCount}
            label="Total Users"
            delay={0.2}
          />
          <StatCard
            icon={TrendingUp}
            value={productsCount}
            label="Products Available"
            delay={0.3}
          />
        </div>
      </div>
    </div>
  );
}
