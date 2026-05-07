import { motion } from "framer-motion";
import { Shield, Lock, CreditCard, Zap } from "lucide-react";

export function FooterTrustBadges() {
  const badges = [
    {
      icon: Shield,
      label: "SSL Secure",
      description: "256-bit encryption",
    },
    {
      icon: Lock,
      label: "Privacy Protected",
      description: "Your data is safe",
    },
    {
      icon: CreditCard,
      label: "Secure Payments",
      description: "Trusted checkout",
    },
    {
      icon: Zap,
      label: "Instant Delivery",
      description: "Get it immediately",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 py-4 max-w-6xl mx-auto">
      {badges.map((badge, index) => (
        <motion.div
          key={badge.label}
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          whileHover={{ y: -5, transition: { duration: 0.2 } }}
          transition={{ delay: index * 0.1 }}
          className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 hover:border-primary/30 transition-all group"
        >
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
            <badge.icon className="w-5 h-5 text-primary" />
          </div>
          <div className="text-left">
            <div className="text-sm font-semibold text-white group-hover:text-primary transition-colors">{badge.label}</div>
            <div className="text-[11px] text-white/50">{badge.description}</div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}