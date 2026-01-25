import { useEffect, useState } from 'react';
import { Search, Shield, User, UserCog, Loader2 } from 'lucide-react';
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
  role?: string;
}

const Users = () => {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [updatingRole, setUpdatingRole] = useState(false);
  const { toast } = useToast();

  const fetchUsers = async () => {
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
  };

  useEffect(() => {
    fetchUsers();
  }, []);

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
        description: `${selectedUser.full_name || selectedUser.email}'s role has been changed to ${newRole}`,
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
          <div>
            <h1 className="text-2xl font-bold text-foreground">User Management</h1>
            <p className="text-muted-foreground">Manage users and assign roles (Admin, Moderator, User)</p>
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
            </div>
          ) : (
            <AdminTable minWidthClassName="min-w-[760px]">
                  <thead className={ADMIN_TABLE_HEADER_CLASS}>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left p-4 font-medium text-foreground whitespace-nowrap">User</th>
                      <th className="text-left p-4 font-medium text-foreground whitespace-nowrap">Email</th>
                      <th className="text-left p-4 font-medium text-foreground whitespace-nowrap">Role</th>
                      <th className="text-left p-4 font-medium text-foreground whitespace-nowrap">Joined</th>
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
                        <td className="p-4 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedUser(user);
                              setIsRoleDialogOpen(true);
                            }}
                          >
                            <UserCog className="w-4 h-4 mr-2" />
                            Change Role
                          </Button>
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
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
};

export default Users;
