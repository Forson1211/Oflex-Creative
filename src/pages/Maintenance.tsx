import { motion } from 'framer-motion';
import { Hammer, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/GlassCard';

const Maintenance = () => {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4 overflow-hidden relative">
            {/* Background Orbs */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] -z-10 animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[128px] -z-10 animate-pulse delay-700" />

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-xl w-full text-center"
            >
                <GlassCard className="p-12 border-primary/20 bg-card/50 backdrop-blur-xl">
                    <div className="w-24 h-24 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-8 transform -rotate-6">
                        <Hammer className="w-12 h-12 text-primary" />
                    </div>

                    <h1 className="text-4xl font-bold text-foreground mb-4">Under Maintenance</h1>
                    <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                        We're currently performing some scheduled updates to improve your experience.
                        We'll be back online very soon!
                    </p>

                    <div className="space-y-4">
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-primary"
                                initial={{ width: "0%" }}
                                animate={{ width: "100%" }}
                                transition={{ duration: 10, repeat: Infinity }}
                            />
                        </div>
                        <p className="text-sm text-muted-foreground italic">Patience is a virtue...</p>
                    </div>

                    <div className="mt-12 pt-8 border-t border-border/50">
                        <Button size="lg" variant="outline" className="gap-2" onClick={() => window.location.reload()}>
                            <Home className="w-4 h-4" />
                            Check Again
                        </Button>
                    </div>
                </GlassCard>
            </motion.div>
        </div>
    );
};

export default Maintenance;
