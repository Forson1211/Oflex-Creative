import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Key } from 'lucide-react';

export const SecurityCheck = ({ children }: { children: React.ReactNode }) => {
    const { user } = useAuth();
    const [needsReset, setNeedsReset] = useState(false);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (!user) {
            setNeedsReset(false);
            return;
        }

        const checkSecurity = async () => {
            const { data, error } = await supabase
                .from('profiles')
                .select('force_password_reset')
                .eq('user_id', user.id)
                .maybeSingle();

            if (data?.force_password_reset) {
                setNeedsReset(true);
            }
        };

        checkSecurity();
    }, [user]);

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            toast({
                title: 'Error',
                description: 'Passwords do not match',
                variant: 'destructive',
            });
            return;
        }

        if (password.length < 6) {
            toast({
                title: 'Error',
                description: 'Password must be at least 6 characters',
                variant: 'destructive',
            });
            return;
        }

        setLoading(true);
        try {
            // 1. Update the password in Supabase Auth
            const { error: authError } = await supabase.auth.updateUser({
                password: password
            });

            if (authError) throw authError;

            // 2. Clear the force_password_reset flag in profile
            const { error: profileError } = await supabase
                .from('profiles')
                .update({ force_password_reset: false })
                .eq('user_id', user?.id);

            if (profileError) throw profileError;

            toast({
                title: 'Success',
                description: 'Password has been updated successfully',
            });

            setNeedsReset(false);
            setPassword('');
            setConfirmPassword('');
        } catch (error) {
            console.error('Error updating password:', error);
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to update password',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {children}

            <Dialog open={needsReset} onOpenChange={() => { }}>
                <DialogContent className="sm:max-w-[425px]" onPointerDownOutside={(e) => e.preventDefault()}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-amber-600">
                            <Key className="w-5 h-5" />
                            Reset Password Required
                        </DialogTitle>
                        <DialogDescription>
                            An administrator has requested that you change your password for security reasons.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUpdatePassword} className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="new-password">New Password</Label>
                            <Input
                                id="new-password"
                                type="password"
                                placeholder="6+ characters"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirm-password">Confirm Password</Label>
                            <Input
                                id="confirm-password"
                                type="password"
                                placeholder="Repeat password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>
                        <DialogFooter>
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    'Update Password'
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </>
    );
};
