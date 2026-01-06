import { useEffect, useState } from 'react';
import { Search, Shield, User } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ProtectedRoute } from '@/components/admin/ProtectedRoute';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';

type Profile = Tables<'profiles'>;
type UserRole = Tables<'user_roles'>;

interface UserWithRole extends Profile {
  role?: string;
}

const Users = () => {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
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

  const filteredUsers = users.filter(
    (user) =>
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <ProtectedRoute requireAdmin>
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Users</h1>
            <p className="text-muted-foreground">View registered users</p>
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
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left p-4 font-medium text-foreground">User</th>
                      <th className="text-left p-4 font-medium text-foreground">Email</th>
                      <th className="text-left p-4 font-medium text-foreground">Role</th>
                      <th className="text-left p-4 font-medium text-foreground">Joined</th>
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
                        <td className="p-4 text-muted-foreground">{user.email}</td>
                        <td className="p-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full capitalize ${
                              user.role === 'admin'
                                ? 'bg-primary/20 text-primary'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {user.role === 'admin' ? (
                              <Shield className="w-3 h-3" />
                            ) : (
                              <User className="w-3 h-3" />
                            )}
                            {user.role}
                          </span>
                        </td>
                        <td className="p-4 text-muted-foreground">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
};

export default Users;
