import { useEffect, useState, useCallback } from 'react';
import { Shield, UserCog, User, Lock, Key, ShieldAlert, Loader2, Unlock, Mail, History, Search } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ProtectedRoute } from '@/components/admin/ProtectedRoute';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';
import { AdminTable, ADMIN_TABLE_HEADER_CLASS } from '@/components/admin/AdminTable';

type Profile = Tables<'profiles'>;
type UserRole = Tables<'user_roles'>;

interface UserWithRole extends Profile {
  role: string | null;
}

interface UserActivity {
  activity_type: string;
  ip_address: string | null;
  created_at: string;
}

interface UserSecurityInfo {
  user_id: string;
  email: string;
  full_name: string | null;
  account_locked: boolean;
  locked_reason: string | null;
  locked_at: string | null;
  force_password_reset: boolean;
  last_login_at: string | null;
  last_login_ip: string | null;
  failed_login_attempts: number;
  last_failed_login_at: string | null;
  created_at: string;
  recent_activity: UserActivity[];
}

const Users = () => {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isSecurityDialogOpen, setIsSecurityDialogOpen] = useState(false);
  const [updatingRole, setUpdatingRole] = useState(false);
  const [processingSecurity, setProcessingSecurity] = useState(false);
  const [securityInfo, setSecurityInfo] = useState<UserSecurityInfo | null>(null);
  const [loadingSecurityInfo, setLoadingSecurityInfo] = useState(false);
  const { toast } = useToast();

  const fetchUsers = useCallback(async () => {
    setLoading(true);

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (profilesError) {
      toast({
        title: 'Error',
        description: 'Failed to fetch users',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('*');

    if (rolesError) {
      console.error('Error fetching roles:', rolesError);
    }

    const usersWithRoles = profiles?.map((profile) => ({
      ...profile,
      role: roles?.find((r) => r.user_id === profile.user_id)?.role || 'user',
    })) || [];

    setUsers(usersWithRoles);
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSyncUsers = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-users-profiles');
      if (error) throw error;

      toast({
        title: 'Users synced',
        description: `Synced ${data?.inserted_or_updated ?? 0} user profile(s).`,
      });

      await fetchUsers();
    } catch (error) {
      console.error('Error syncing users:', error);
      toast({
        title: 'Sync failed',
        description: error instanceof Error ? error.message : 'Unable to sync users right now.',
        variant: 'destructive',
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleRoleChange = async (newRole: string) => {
    if (!selectedUser) return;

    setUpdatingRole(true);

    try {
      // Check if user already has a role entry
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', selectedUser.user_id)
        .maybeSingle();

      if (existingRole) {
        // Update existing role
        const { error } = await supabase
          .from('user_roles')
          .update({ role: newRole as 'admin' | 'moderator' | 'user' })
          .eq('user_id', selectedUser.user_id);

        if (error) throw error;
      } else {
        // Insert new role
        const { error } = await supabase
          .from('user_roles')
          .insert({
            user_id: selectedUser.user_id,
            role: newRole as 'admin' | 'moderator' | 'user'
          });

        if (error) throw error;
      }

      toast({
        title: 'Role Updated',
        description: `${selectedUser.full_name || selectedUser.email || 'User'}'s role has been changed to ${newRole}`,
      });

      setIsRoleDialogOpen(false);
      fetchUsers();
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user role',
        variant: 'destructive',
      });
    } finally {
      setUpdatingRole(false);
    }
  };

  const handleFetchSecurityInfo = async (userId: string) => {
    setLoadingSecurityInfo(true);
    try {
      const { data, error } = await supabase.rpc('admin_get_user_security_info', {
        p_user_id: userId
      });
      if (error) throw error;
      setSecurityInfo(data as unknown as UserSecurityInfo);
    } catch (error) {
      console.error('Error fetching security info:', error);
      toast({
        title: 'Error',
        description: 'Failed to load user security information',
        variant: 'destructive',
      });
    } finally {
      setLoadingSecurityInfo(false);
    }
  };

  const handleLockAccount = async (lock: boolean, reason: string = '') => {
    if (!selectedUser) return;
    setProcessingSecurity(true);
    try {
      const { data, error } = await supabase.rpc('admin_lock_user_account', {
        p_user_id: selectedUser.user_id,
        p_lock: lock,
        p_reason: reason || (lock ? 'Locked by admin' : null)
      });

      if (error) throw error;

      toast({
        title: lock ? 'Account Locked' : 'Account Unlocked',
        description: `Successfully ${lock ? 'locked' : 'unlocked'} ${selectedUser.full_name || selectedUser.email}`,
      });

      handleFetchSecurityInfo(selectedUser.user_id!);
      fetchUsers();
    } catch (error) {
      console.error('Error locking account:', error);
      toast({
        title: 'Error',
        description: 'Failed to update account lock status',
        variant: 'destructive',
      });
    } finally {
      setProcessingSecurity(false);
    }
  };

  const handleForcePasswordReset = async () => {
    if (!selectedUser) return;
    setProcessingSecurity(true);
    try {
      const { data, error } = await supabase.rpc('admin_force_password_reset', {
        p_user_id: selectedUser.user_id
      });

      if (error) throw error;

      toast({
        title: 'Password Reset Forced',
        description: 'User will be required to change password on next login',
      });

      handleFetchSecurityInfo(selectedUser.user_id!);
    } catch (error) {
      console.error('Error forcing reset:', error);
      toast({
        title: 'Error',
        description: 'Failed to force password reset',
        variant: 'destructive',
      });
    } finally {
      setProcessingSecurity(false);
    }
  };

  const handleSendResetEmail = async () => {
    if (!selectedUser?.email) return;
    setProcessingSecurity(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-reset-password', {
        body: { userEmail: selectedUser.email }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast({
        title: 'Email Sent',
        description: `Password reset instructions sent to ${selectedUser.email}`,
      });
    } catch (error) {
      console.error('Error sending reset email:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send reset email',
        variant: 'destructive',
      });
    } finally {
      setProcessingSecurity(false);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-3 h-3" />;
      case 'moderator':
        return <UserCog className="w-3 h-3" />;
      default:
        return <User className="w-3 h-3" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-primary/20 text-primary';
      case 'moderator':
        return 'bg-accent text-accent-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <ProtectedRoute requireAdmin>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">User Management</h1>
              <p className="text-muted-foreground">Manage users and assign roles (Admin, Moderator, User)</p>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleSyncUsers}
              disabled={syncing || loading}
              className="self-start"
            >
              {syncing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Sync Users
            </Button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 max-w-sm"
            />
          </div>

          {loading ? (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="animate-pulse">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="p-4 border-b border-border last:border-0">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-muted rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-muted rounded w-32 mb-2"></div>
                        <div className="h-3 bg-muted rounded w-48"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-12 text-center">
              <p className="text-muted-foreground">No users found</p>
              <div className="mt-4">
                <Button type="button" variant="outline" onClick={handleSyncUsers} disabled={syncing}>
                  {syncing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Sync Users
                </Button>
              </div>
            </div>
          ) : (
            <AdminTable minWidthClassName="min-w-[760px]">
              <thead className={ADMIN_TABLE_HEADER_CLASS}>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left p-4 font-medium text-foreground whitespace-nowrap">User</th>
                  <th className="text-left p-4 font-medium text-foreground whitespace-nowrap">Email</th>
                  <th className="text-left p-4 font-medium text-foreground whitespace-nowrap">Role</th>
                  <th className="text-left p-4 font-medium text-foreground whitespace-nowrap">Joined</th>
                  <th className="text-left p-4 font-medium text-foreground whitespace-nowrap">Security</th>
                  <th className="text-right p-4 font-medium text-foreground whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-border last:border-0">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-medium">
                          {user.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                        </div>
                        <p className="font-medium text-foreground">
                          {user.full_name || 'No name'}
                        </p>
                      </div>
                    </td>
                    <td className="p-4 text-muted-foreground whitespace-nowrap">{user.email}</td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full capitalize ${getRoleColor(user.role || 'user')}`}
                      >
                        {getRoleIcon(user.role || 'user')}
                        {user.role}
                      </span>
                    </td>
                    <td className="p-4 text-muted-foreground whitespace-nowrap">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {user.account_locked && (
                          <span title="Account Locked" className="text-destructive">
                            <Lock className="w-4 h-4" />
                          </span>
                        )}
                        {user.force_password_reset && (
                          <span title="Password Reset Required" className="text-amber-500">
                            <Key className="w-4 h-4" />
                          </span>
                        )}
                        {!user.account_locked && !user.force_password_reset && (
                          <span title="Secure" className="text-green-500">
                            <Shield className="w-4 h-4" />
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user);
                            setSecurityInfo(null);
                            setIsSecurityDialogOpen(true);
                            handleFetchSecurityInfo(user.user_id!);
                          }}
                        >
                          <ShieldAlert className="w-4 h-4 mr-2" />
                          Security
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user);
                            setIsRoleDialogOpen(true);
                          }}
                        >
                          <UserCog className="w-4 h-4 mr-2" />
                          Role
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </AdminTable>
          )}

          {/* Role Change Dialog */}
          <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Change User Role</DialogTitle>
                <DialogDescription>
                  Update the role for {selectedUser?.full_name || selectedUser?.email}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Select Role</label>
                  <Select
                    defaultValue={selectedUser?.role || 'user'}
                    onValueChange={handleRoleChange}
                    disabled={updatingRole}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <div>
                            <p className="font-medium">User</p>
                            <p className="text-xs text-muted-foreground">Regular user with basic access</p>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="moderator">
                        <div className="flex items-center gap-2">
                          <UserCog className="w-4 h-4" />
                          <div>
                            <p className="font-medium">Moderator</p>
                            <p className="text-xs text-muted-foreground">Can manage content and view dashboard</p>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="admin">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          <div>
                            <p className="font-medium">Admin</p>
                            <p className="text-xs text-muted-foreground">Full access to all features and settings</p>
                          </div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {updatingRole && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Updating role...</span>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
          {/* Security Dialog */}
          <Dialog open={isSecurityDialogOpen} onOpenChange={setIsSecurityDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  User Security: {selectedUser?.full_name || selectedUser?.email || 'User'}
                </DialogTitle>
                <DialogDescription>
                  Manage account status and password security
                </DialogDescription>
              </DialogHeader>

              {loadingSecurityInfo ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : securityInfo ? (
                <div className="space-y-6 pt-4">
                  {/* Status Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className={`p-4 rounded-lg border ${securityInfo.account_locked ? 'bg-destructive/5 border-destructive/20' : 'bg-green-500/5 border-green-500/20'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Account Status</span>
                        {securityInfo.account_locked ? (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-destructive text-destructive-foreground font-bold uppercase">Locked</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-green-500 text-white font-bold uppercase">Active</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-4">
                        {securityInfo.account_locked
                          ? `Locked on ${new Date(securityInfo.locked_at).toLocaleString()}${securityInfo.locked_reason ? ` for: ${securityInfo.locked_reason}` : ''}`
                          : 'Account is currently open and active'}
                      </p>
                      <Button
                        size="sm"
                        variant={securityInfo.account_locked ? "default" : "outline"}
                        className="w-full"
                        disabled={processingSecurity}
                        onClick={() => handleLockAccount(!securityInfo.account_locked)}
                      >
                        {processingSecurity ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : (securityInfo.account_locked ? <Unlock className="w-3 h-3 mr-2" /> : <Lock className="w-3 h-3 mr-2" />)}
                        {securityInfo.account_locked ? 'Unlock Account' : 'Lock Account'}
                      </Button>
                    </div>

                    <div className={`p-4 rounded-lg border ${securityInfo.force_password_reset ? 'bg-amber-500/5 border-amber-500/20' : 'bg-muted/50 border-border'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Password Security</span>
                        {securityInfo.force_password_reset && (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500 text-white font-bold uppercase">Reset Required</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-4">
                        {securityInfo.force_password_reset
                          ? 'User must change password on their next login session'
                          : 'No pending security updates required for this account'}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          disabled={processingSecurity || securityInfo.force_password_reset}
                          onClick={handleForcePasswordReset}
                        >
                          {processingSecurity ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : <Key className="w-3 h-3 mr-2" />}
                          Force Reset
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          disabled={processingSecurity}
                          onClick={handleSendResetEmail}
                        >
                          {processingSecurity ? <Loader2 className="w-3 h-3 mr-2 animate-spin" /> : <Mail className="w-3 h-3 mr-2" />}
                          Send Email
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Activity Details */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium flex items-center gap-2">
                      <History className="w-4 h-4" />
                      Login Information
                    </h3>
                    <div className="bg-muted/30 rounded-lg p-3 grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <p className="text-muted-foreground">Last Login</p>
                        <p className="font-medium">{securityInfo.last_login_at ? new Date(securityInfo.last_login_at).toLocaleString() : 'Never'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Last Login IP</p>
                        <p className="font-medium font-mono">{securityInfo.last_login_ip || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Failed Attempts</p>
                        <p className={`font-medium ${securityInfo.failed_login_attempts > 0 ? 'text-destructive font-bold' : ''}`}>{securityInfo.failed_login_attempts}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Created On</p>
                        <p className="font-medium">{new Date(securityInfo.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity Log */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium">Recent Activity</h3>
                    <div className="border border-border rounded-lg overflow-hidden">
                      <table className="w-full text-xs">
                        <thead className="bg-muted/50 border-b border-border">
                          <tr>
                            <th className="text-left p-2 font-medium">Event</th>
                            <th className="text-left p-2 font-medium">IP</th>
                            <th className="text-right p-2 font-medium">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {securityInfo.recent_activity?.length > 0 ? (
                            securityInfo.recent_activity.map((act: UserActivity, i: number) => (
                              <tr key={i} className="border-b border-border last:border-0">
                                <td className="p-2 capitalize">{act.activity_type.replace(/_/g, ' ')}</td>
                                <td className="p-2 font-mono text-muted-foreground">{act.ip_address || 'Internal'}</td>
                                <td className="p-2 text-right text-muted-foreground">{new Date(act.created_at).toLocaleString()}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={3} className="p-4 text-center text-muted-foreground">No recent activity logged</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : null}
            </DialogContent>
          </Dialog>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
};

export default Users;
