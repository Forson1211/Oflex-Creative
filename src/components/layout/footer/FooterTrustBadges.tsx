 import { motion } from "framer-motion";
 import { Shield, Lock, CreditCard } from "lucide-react";
 
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
   ];
 
   return (
     <div className="flex flex-wrap items-center justify-center gap-4 py-4">
       {badges.map((badge, index) => (
         <motion.div
           key={badge.label}
           initial={{ opacity: 0, y: 10 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           transition={{ delay: index * 0.1 }}
           className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10"
         >
           <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
             <badge.icon className="w-4 h-4 text-primary" />
           </div>
           <div className="text-left">
             <div className="text-xs font-medium text-white">{badge.label}</div>
             <div className="text-[10px] text-white/50">{badge.description}</div>
           </div>
         </motion.div>
       ))}
     </div>
   );
 }