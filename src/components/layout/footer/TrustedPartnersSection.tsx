import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

interface TrustedPartner {
  id: string;
  name: string;
  logo_url: string;
  website_url: string | null;
  display_order: number;
  is_active: boolean;
}

export function TrustedPartnersSection() {
  const { data: partners = [] } = useQuery({
    queryKey: ["trusted-partners-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trusted_partners")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as TrustedPartner[];
    },
  });

  if (partners.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.35 }}
      className="mt-12 pt-8 border-t border-border"
    >
      <p className="text-center text-sm text-muted-foreground mb-6">Trusted platforms I work with</p>
      <div className="flex flex-wrap items-center justify-center gap-8">
        {partners.map((partner) => (
          <motion.a
            key={partner.id}
            href={partner.website_url || "#"}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.06 }}
            className="opacity-90 hover:opacity-100 transition-opacity"
          >
            <img
              src={partner.logo_url}
              alt={partner.name}
              loading="lazy"
              decoding="async"
              className="h-8 w-auto max-w-[140px] object-contain dark:brightness-110"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </motion.a>
        ))}
      </div>
    </motion.div>
  );
}
