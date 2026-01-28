import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { useToast } from '@/hooks/use-toast';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { z } from 'zod';

const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isUpdatePassword, setIsUpdatePassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [pendingEmailConfirmation, setPendingEmailConfirmation] = useState<string | null>(null);
  const [showResend, setShowResend] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [otpToken, setOtpToken] = useState('');

  const { signIn, signUp, resendSignupConfirmation, resetPasswordForEmail, verifyOtp, user, loading, isAuthReady } = useAuth();
  const { getSetting, isLoading: settingsLoading } = useSiteSettings();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const logoUrl = getSetting('logo_url', '');
  const siteName = getSetting('site_name', '');

  useEffect(() => {
    if (searchParams.get('update_password') === 'true') {
      setIsUpdatePassword(true);
    } else {
      // If we navigate to /auth normally (clicking Login in Navbar), 
      // reset to the main login view
      setIsLogin(true);
      setIsForgotPassword(false);
      setIsUpdatePassword(false);
      setIsVerifying(false);
    }
  }, [location.pathname, searchParams]);

  // Optimized redirect - only redirect when auth is fully ready and user exists
  useEffect(() => {
    if (isAuthReady && !loading && user && !isUpdatePassword) {
      navigate('/', { replace: true });
    }
  }, [user, loading, isAuthReady, navigate, isUpdatePassword]);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!isUpdatePassword) {
      const emailResult = emailSchema.safeParse(email);
      if (!emailResult.success) {
        newErrors.email = emailResult.error.errors[0].message;
      }
    }

    // Validate Password (required for Login, Signup, Update)
    // Forgot Password does NOT need password validation
    if (!isForgotPassword) {
      const passwordResult = passwordSchema.safeParse(password);
      if (!passwordResult.success) {
        newErrors.password = passwordResult.error.errors[0].message;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setErrors({ password: 'Password must be at least 6 characters' });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await import('@/integrations/supabase/client').then(m => m.supabase.auth.updateUser({ password }));
      if (error) throw error;

      toast({
        title: 'Password Updated',
        description: 'Your password has been changed successfully.',
      });
      navigate('/');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      setErrors({ email: emailResult.error.errors[0].message });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await resetPasswordForEmail(email);
      if (error) throw error;

      toast({
        title: 'Check your email',
        description: 'We sent you a password reset link.',
      });
      setIsForgotPassword(false);
      setIsLogin(true);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpToken.length !== 6) {
      toast({
        title: 'Invalid Code',
        description: 'Please enter all 6 digits.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (!pendingEmailConfirmation) throw new Error("Email not found. Please try signing up again.");
      const { error } = await verifyOtp(pendingEmailConfirmation, otpToken);
      if (error) throw error;

      toast({
        title: 'Account Verified!',
        description: 'You have successfully signed up and logged in.',
      });
      navigate('/');
    } catch (error: any) {
      toast({
        title: 'Verification Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isVerifying) return handleVerifyOtp(e);
    if (isUpdatePassword) return handleUpdatePassword(e);
    if (isForgotPassword) return handleForgotPassword(e);

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          const msg = error.message || '';
          const isUnconfirmed = /confirm|confirmed/i.test(msg);
          if (isUnconfirmed) {
            setShowResend(true);
            setPendingEmailConfirmation(email);
          }
          toast({
            title: 'Login Failed',
            description: error.message === 'Invalid login credentials'
              ? 'Invalid email or password. Please try again.'
              : error.message,
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Welcome back!',
            description: 'You have successfully logged in.',
          });
          navigate('/');
        }
      } else {
        const { data, error } = await signUp(email, password, fullName);

        // If enumeration protection is ON, Supabase returns 200 with no error, 
        // but an empty identities array if the user already exists.
        const userExists = data?.user && (!data.user.identities || data.user.identities.length === 0);

        if (error || userExists) {
          if (userExists || (error && error.message.includes('already registered'))) {
            toast({
              title: 'Email Already Registered',
              description: 'This email is already linked to an account. Please sign in instead.',
              variant: 'destructive',
            });
            setIsLogin(true);
            setIsVerifying(false);
          } else if (error && (error.message.includes('email limit reached') || error.message.includes('rate limit'))) {
            toast({
              title: 'Too Many Requests',
              description: 'You have requested too many verification codes. Please wait a few minutes and try again.',
              variant: 'destructive',
            });
          } else if (error) {
            toast({
              title: 'Sign Up Failed',
              description: error.message,
              variant: 'destructive',
            });
            console.error("Signup error:", error);
          }
        } else {
          toast({
            title: 'Verification Code Sent',
            description: 'Please enter the 6-digit code sent to your email.',
          });
          setPendingEmailConfirmation(email);
          setIsVerifying(true);
        }
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      toast({
        title: 'Error',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleResend = async () => {
    if (!pendingEmailConfirmation) return;
    setIsSubmitting(true);

    try {
      const { error } = await resendSignupConfirmation(pendingEmailConfirmation);
      if (error) {
        toast({
          title: 'Could not resend email',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Verification email sent',
        description: 'Please check your inbox (and spam folder).',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Spinner removed - showing form immediately


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
              <img
                src={logoUrl || "/placeholder.svg"}
                alt={siteName || 'Site logo'}
                className="h-10 w-auto"
                loading="eager"
              />
            </Link>
            <h1 className="text-xl font-semibold text-foreground mt-4">
              {isVerifying
                ? 'Verify Your Email'
                : isUpdatePassword
                  ? 'Set New Password'
                  : isForgotPassword
                    ? 'Reset Password'
                    : isLogin
                      ? 'Welcome Back'
                      : 'Create Account'}
            </h1>
            <p className="text-muted-foreground text-sm mt-2">
              {isVerifying
                ? `Enter the 6-digit code sent to ${pendingEmailConfirmation || email}`
                : isUpdatePassword
                  ? 'Please enter your new password below'
                  : isForgotPassword
                    ? 'Enter your email to receive a reset link'
                    : isLogin
                      ? 'Sign in to your account'
                      : 'Sign up to get started'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isVerifying ? (
              <div className="flex flex-col items-center space-y-4 py-4">
                <InputOTP
                  maxLength={6}
                  value={otpToken}
                  onChange={(value) => setOtpToken(value)}
                  disabled={isSubmitting}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Didn't receive the code?{' '}
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={isSubmitting}
                      className="text-primary hover:underline font-medium"
                    >
                      Resend
                    </button>
                  </p>
                </div>
              </div>
            ) : (
              <>
                {!isLogin && !isForgotPassword && !isUpdatePassword && (
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="fullName"
                        type="text"
                        placeholder="John Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                )}

                {!isUpdatePassword && (
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (errors.email) setErrors({ ...errors, email: undefined });
                        }}
                        className="pl-10"
                        disabled={isForgotPassword && isSubmitting}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-sm text-destructive">{errors.email}</p>
                    )}
                  </div>
                )}

                {!isForgotPassword && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">
                        {isUpdatePassword ? 'New Password' : 'Password'}
                      </Label>
                      {isLogin && !isUpdatePassword && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsForgotPassword(true);
                            setErrors({});
                          }}
                          className="text-xs text-primary hover:underline"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (errors.password) setErrors({ ...errors, password: undefined });
                        }}
                        className="pl-10 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-sm text-destructive">{errors.password}</p>
                    )}
                  </div>
                )}
              </>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting
                ? 'Please wait...'
                : isVerifying
                  ? 'Verify Account'
                  : isUpdatePassword
                    ? 'Update Password'
                    : isForgotPassword
                      ? 'Send Reset Link'
                      : isLogin
                        ? 'Sign In'
                        : 'Create Account'}
            </Button>

            {!isVerifying && showResend && pendingEmailConfirmation && (
              <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm">
                <p className="text-foreground">
                  Email verification required. Please verify{' '}
                  <span className="font-medium">{pendingEmailConfirmation}</span> to sign in.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Button type="button" variant="secondary" onClick={handleResend} disabled={isSubmitting}>
                    Resend verification email
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setShowResend(false);
                      setPendingEmailConfirmation(null);
                    }}
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            )}
          </form>

          <div className="mt-6 text-center text-sm">
            {isForgotPassword || isUpdatePassword ? (
              <button
                type="button"
                onClick={() => {
                  setIsForgotPassword(false);
                  setIsUpdatePassword(false);
                  setIsLogin(true);
                  setErrors({});
                  setPassword('');
                }}
                className="text-muted-foreground hover:text-foreground inline-flex items-center"
              >
                <ArrowLeft className="w-3 h-3 mr-1" />
                Back to Sign In
              </button>
            ) : (
              <>
                <span className="text-muted-foreground">
                  {isLogin ? "Don't have an account? " : 'Already have an account? '}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setErrors({});
                    setShowResend(false);
                    setPendingEmailConfirmation(null);
                    setIsVerifying(false);
                    setOtpToken('');
                  }}
                  className="text-primary hover:underline font-medium"
                >
                  {isLogin ? 'Sign Up' : 'Sign In'}
                </button>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
