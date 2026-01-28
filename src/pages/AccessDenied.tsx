import { motion } from 'framer-motion';
import { ShieldAlert, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/GlassCard';

const AccessDenied = () => {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4 overflow-hidden relative">
            {/* Background Orbs */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-destructive/20 rounded-full blur-[128px] -z-10 animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-[128px] -z-10 animate-pulse delay-700" />

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-xl w-full text-center"
            >
                <GlassCard className="p-12 border-destructive/20 bg-card/50 backdrop-blur-xl">
                    <div className="w-24 h-24 bg-destructive/10 rounded-3xl flex items-center justify-center mx-auto mb-8 transform -rotate-12">
                        <ShieldAlert className="w-12 h-12 text-destructive" />
                    </div>

                    <h1 className="text-4xl font-bold text-foreground mb-4 font-sans">Access Denied</h1>
                    <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                        Oops! You don't have the required permissions to access this administrative area.
                        If you believe this is an error, please contact the site administrator.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                        <Button size="lg" className="gap-2" asChild>
                            <Link to="/">
                                <Home className="w-4 h-4" />
                                Return Home
                            </Link>
                        </Button>
                        <Button size="lg" variant="outline" asChild>
                            <Link to="/auth">
                                Sign in as Admin
                            </Link>
                        </Button>
                    </div>
                </GlassCard>
            </motion.div>
        </div>
    );
};

export default AccessDenied;
