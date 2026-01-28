import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile, useUserMutations } from '@/hooks/useUsers';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ProtectedRoute } from '@/components/admin/ProtectedRoute';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { User, Shield, Lock, Save, Loader2, Mail, Camera } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const AdminProfile = () => {
    const { user, isAdmin, isModerator } = useAuth();
    const { data: profile, isLoading: profileLoading } = useProfile(user?.id);
    const { updateProfile } = useUserMutations();
    const { toast } = useToast();

    const [fullName, setFullName] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
    const [passwords, setPasswords] = useState({
        new: '',
        confirm: '',
    });

    useEffect(() => {
        if (profile) {
            setFullName(profile.full_name || '');
            setAvatarUrl(profile.avatar_url || '');
        }
    }, [profile]);

    const handleUpdateProfile = () => {
        if (!user?.id) return;

        updateProfile.mutate(
            { userId: user.id, data: { full_name: fullName, avatar_url: avatarUrl } },
            {
                onSuccess: () => {
                    toast({ title: 'Profile updated successfully' });
                },
            }
        );
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwords.new !== passwords.confirm) {
            toast({ title: 'Passwords do not match', variant: 'destructive' });
            return;
        }
        if (passwords.new.length < 6) {
            toast({ title: 'Password must be at least 6 characters', variant: 'destructive' });
            return;
        }

        setIsUpdatingPassword(true);
        const { error } = await supabase.auth.updateUser({ password: passwords.new });
        setIsUpdatingPassword(false);

        if (error) {
            toast({ title: 'Error updating password', description: error.message, variant: 'destructive' });
        } else {
            toast({ title: 'Password updated successfully' });
            setPasswords({ new: '', confirm: '' });
        }
    };

    return (
        <ProtectedRoute requireModerator>
            <AdminLayout>
                <div className="space-y-6 max-w-4xl mx-auto">
                    <AdminPageHeader
                        title="My Profile"
                        description="Manage your account settings and security"
                        icon={<User className="w-5 h-5" />}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Left Column: Profile Card */}
                        <div className="md:col-span-1 space-y-6">
                            <div className="bg-card border border-border rounded-xl p-6 flex flex-col items-center text-center">
                                <div className="relative mb-4">
                                    <Avatar className="w-24 h-24 border-2 border-border shadow-md">
                                        <AvatarImage src={avatarUrl} />
                                        <AvatarFallback className="text-2xl font-bold bg-muted text-foreground">
                                            {fullName?.charAt(0) || user?.email?.charAt(0)?.toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="absolute bottom-0 right-0 p-1.5 bg-primary text-primary-foreground rounded-full shadow-lg border-2 border-background cursor-pointer hover:scale-110 transition-transform">
                                        <Camera className="w-3 h-3" />
                                    </div>
                                </div>

                                <h2 className="text-xl font-bold text-foreground mb-1">
                                    {profileLoading ? 'Loading...' : fullName || 'Admin User'}
                                </h2>
                                <div className="flex items-center gap-2 mb-4">
                                    <Badge variant={isAdmin ? "default" : "secondary"} className="uppercase text-[10px] tracking-wider">
                                        {isAdmin ? 'Administrator' : isModerator ? 'Moderator' : 'User'}
                                    </Badge>
                                </div>

                                <div className="w-full text-left space-y-3 mt-2">
                                    <div className="flex items-center gap-3 text-sm text-muted-foreground p-2 rounded-lg bg-muted/50">
                                        <Mail className="w-4 h-4 text-primary" />
                                        <span className="truncate">{user?.email}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-muted-foreground p-2 rounded-lg bg-muted/50">
                                        <Shield className="w-4 h-4 text-primary" />
                                        <span>Role: {isAdmin ? 'Admin' : 'Moderator'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Edit Forms */}
                        <div className="md:col-span-2 space-y-6">

                            {/* Profile Details */}
                            <div className="bg-card border border-border rounded-xl p-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <User className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold">Profile Details</h3>
                                        <p className="text-sm text-muted-foreground">Update your personal information</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="fullName">Full Name</Label>
                                        <Input
                                            id="fullName"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            placeholder="Enter your full name"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="avatarUrl">Avatar URL</Label>
                                        <Input
                                            id="avatarUrl"
                                            value={avatarUrl}
                                            onChange={(e) => setAvatarUrl(e.target.value)}
                                            placeholder="https://..."
                                        />
                                        <p className="text-xs text-muted-foreground">Link to your profile picture (optional)</p>
                                    </div>

                                    <div className="pt-2 flex justify-end">
                                        <Button onClick={handleUpdateProfile} disabled={updateProfile.isPending}>
                                            {updateProfile.isPending ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    Saving...
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="w-4 h-4 mr-2" />
                                                    Save Changes
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Security */}
                            <div className="bg-card border border-border rounded-xl p-6">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                                        <Lock className="w-5 h-5 text-destructive" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold">Security</h3>
                                        <p className="text-sm text-muted-foreground">Change your password</p>
                                    </div>
                                </div>

                                <form onSubmit={handleUpdatePassword} className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="newPass">New Password</Label>
                                            <Input
                                                id="newPass"
                                                type="password"
                                                value={passwords.new}
                                                onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                                                placeholder="Min 6 characters"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="confirmPass">Confirm Password</Label>
                                            <Input
                                                id="confirmPass"
                                                type="password"
                                                value={passwords.confirm}
                                                onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                                                placeholder="Confirm new password"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-2 flex justify-end">
                                        <Button type="submit" disabled={isUpdatingPassword} variant="outline" className="text-foreground">
                                            {isUpdatingPassword ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    Updating...
                                                </>
                                            ) : (
                                                'Update Password'
                                            )}
                                        </Button>
                                    </div>
                                </form>
                            </div>

                        </div>
                    </div>
                </div>
            </AdminLayout>
        </ProtectedRoute>
    );
};

export default AdminProfile;
