import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useToast } from '@/hooks/use-toast';

const isGoogleUser = (u: { app_metadata?: any; identities?: Array<{ provider?: string }> } | null) => {
  if (!u) return false;
  const provider = u.app_metadata?.provider;
  const identitiesProvider = u.identities?.[0]?.provider;
  return provider === 'google' || identitiesProvider === 'google';
};

const Auth = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [googleBlocked, setGoogleBlocked] = useState(false);

  const { signInWithGoogle, signOut, user, loading } = useAuth();
  const { getSetting, isLoading: settingsLoading } = useSiteSettings();
  const { toast } = useToast();
  const navigate = useNavigate();

  const logoUrl = getSetting('logo_url', '');
  const siteName = getSetting('site_name', '');

  useEffect(() => {
    if (!loading && user) {
      if (!isGoogleUser(user)) {
        setGoogleBlocked(true);
        // Must be deferred to avoid auth deadlocks
        setTimeout(() => {
          void signOut();
        }, 0);
        return;
      }

      navigate('/');
    }
  }, [user, loading, navigate]);

  const handleGoogle = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        toast({
          title: 'Google sign-in failed',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }
      // OAuth redirect happens automatically on success
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center justify-center">
              {settingsLoading ? (
                <div className="h-10 w-24 bg-muted animate-pulse rounded" />
              ) : (
                <img
                  src={logoUrl || '/placeholder.svg'}
                  alt={siteName || 'Site logo'}
                  className="h-10 w-auto"
                  loading="eager"
                />
              )}
            </Link>
            <h1 className="text-xl font-semibold text-foreground mt-4">Continue with Google</h1>
            <p className="text-muted-foreground text-sm mt-2">
              Only verified Google accounts can create an account or log in.
            </p>
          </div>

           <div className="space-y-4">
             <p className="text-muted-foreground text-sm">
               Sign in with a verified Google account to continue.
             </p>

             {googleBlocked && (
               <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm">
                 <p className="text-foreground">
                   Only Google accounts are allowed. Please sign in with Google.
                 </p>
               </div>
             )}

             <Button className="w-full" onClick={handleGoogle} disabled={isSubmitting}>
               {isSubmitting ? 'Please wait...' : 'Continue with Google'}
             </Button>
           </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
