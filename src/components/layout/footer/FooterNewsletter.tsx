import { useState } from "react";
import { motion } from "framer-motion";
import { Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

type Props = {
  hasCustomColor: boolean;
};

export function FooterNewsletter({ hasCustomColor }: Props) {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubscribing(true);
    // Simulate subscription
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toast({ title: "Subscribed!", description: "Thanks for subscribing to our newsletter." });
    setEmail("");
    setIsSubscribing(false);
  };

  return (
    <div
      className={
        "border-b border-border " +
        (!hasCustomColor ? "bg-gradient-to-r from-primary/5 via-transparent to-primary/5" : "")
      }
    >
      <div className="container mx-auto px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto text-center"
        >
          <h4 className="text-xl md:text-2xl font-bold text-foreground mb-2">
            Subscribe to Our Newsletter
          </h4>
          <p className="text-sm md:text-base text-muted-foreground mb-6">
            Stay updated with our latest projects, creative insights, and exclusive offers
          </p>

          <form
            onSubmit={handleSubscribe}
            className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
          >
            <Input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 h-12"
              required
            />
            <Button type="submit" size="lg" disabled={isSubscribing} className="h-12 px-6">
              {isSubscribing ? (
                <span className="flex items-center gap-2">
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Send className="w-4 h-4" />
                  </motion.span>
                  Subscribing...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  Subscribe
                </span>
              )}
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
