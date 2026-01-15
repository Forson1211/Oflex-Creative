import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ProtectedRoute } from '@/components/admin/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useImageUpload } from '@/hooks/useImageUpload';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Edit, Trash2, Loader2, Save, Users, FileText } from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string | null;
  image_url: string | null;
  display_order: number;
  is_active: boolean;
}

interface SiteSetting {
  id: string;
  setting_key: string;
  setting_value: string | null;
}

const AboutPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [memberForm, setMemberForm] = useState({
    name: '',
    role: '',
    bio: '',
    image_url: '',
    display_order: 0,
    is_active: true,
  });

  const { uploadImage: uploadAboutImage, isUploading: isUploadingAbout } = useImageUpload({
    bucket: 'site-assets',
    onSuccess: (url) => updateSetting('about_image_url', url),
  });

  const { uploadImage: uploadMemberImage, isUploading: isUploadingMember } = useImageUpload({
    bucket: 'site-assets',
    onSuccess: (url) => setMemberForm(prev => ({ ...prev, image_url: url })),
  });

  // Fetch site settings
  const { data: siteSettings = [], isLoading: loadingSettings } = useQuery({
    queryKey: ['about-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .like('setting_key', 'about_%');
      if (error) throw error;
      return data as SiteSetting[];
    },
  });

  // Fetch team members
  const { data: teamMembers = [], isLoading: loadingMembers } = useQuery({
    queryKey: ['team-members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data as TeamMember[];
    },
  });

  useEffect(() => {
    if (siteSettings.length > 0) {
      const settingsObj: Record<string, string> = {};
      siteSettings.forEach((s) => {
        settingsObj[s.setting_key] = s.setting_value || '';
      });
      setSettings(settingsObj);
    }
  }, [siteSettings]);

  const saveSettingsMutation = useMutation({
    mutationFn: async () => {
      const updates = Object.entries(settings).map(([key, value]) => ({
        setting_key: key,
        setting_value: value,
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from('site_settings')
          .update({ setting_value: update.setting_value })
          .eq('setting_key', update.setting_key);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['about-settings'] });
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      toast({ title: 'About page settings saved!' });
    },
    onError: () => {
      toast({ title: 'Error saving settings', variant: 'destructive' });
    },
  });

  const saveMemberMutation = useMutation({
    mutationFn: async (data: typeof memberForm) => {
      if (editingMember) {
        const { error } = await supabase
          .from('team_members')
          .update(data)
          .eq('id', editingMember.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('team_members').insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      toast({ title: editingMember ? 'Team member updated!' : 'Team member added!' });
      resetMemberForm();
    },
    onError: () => {
      toast({ title: 'Error saving team member', variant: 'destructive' });
    },
  });

  const deleteMemberMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('team_members').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      toast({ title: 'Team member deleted!' });
    },
    onError: () => {
      toast({ title: 'Error deleting team member', variant: 'destructive' });
    },
  });

  const updateSetting = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const resetMemberForm = () => {
    setIsDialogOpen(false);
    setEditingMember(null);
    setMemberForm({
      name: '',
      role: '',
      bio: '',
      image_url: '',
      display_order: 0,
      is_active: true,
    });
  };

  const handleEditMember = (member: TeamMember) => {
    setEditingMember(member);
    setMemberForm({
      name: member.name,
      role: member.role,
      bio: member.bio || '',
      image_url: member.image_url || '',
      display_order: member.display_order,
      is_active: member.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMemberMutation.mutate(memberForm);
  };

  if (loadingSettings || loadingMembers) {
    return (
      <ProtectedRoute requireAdmin>
        <AdminLayout>
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </AdminLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requireAdmin>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">About Page</h1>
              <p className="text-muted-foreground">Manage the about page content and team members</p>
            </div>
          </div>

          <Tabs defaultValue="content" className="space-y-6">
            <TabsList>
              <TabsTrigger value="content" className="gap-2">
                <FileText className="w-4 h-4" />
                Page Content
              </TabsTrigger>
              <TabsTrigger value="team" className="gap-2">
                <Users className="w-4 h-4" />
                Team Members
              </TabsTrigger>
            </TabsList>

            {/* Page Content Tab */}
            <TabsContent value="content" className="space-y-6">
              <div className="bg-card border border-border rounded-xl p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-foreground">About Page Content</h2>
                  <Button onClick={() => saveSettingsMutation.mutate()} disabled={saveSettingsMutation.isPending}>
                    {saveSettingsMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save Changes
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="about_title">Page Title</Label>
                    <Input
                      id="about_title"
                      value={settings.about_title || ''}
                      onChange={(e) => updateSetting('about_title', e.target.value)}
                      placeholder="Crafting Digital Excellence"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="about_story_title">Story Section Title</Label>
                    <Input
                      id="about_story_title"
                      value={settings.about_story_title || ''}
                      onChange={(e) => updateSetting('about_story_title', e.target.value)}
                      placeholder="The Journey So Far"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="about_description">Page Description</Label>
                  <Textarea
                    id="about_description"
                    value={settings.about_description || ''}
                    onChange={(e) => updateSetting('about_description', e.target.value)}
                    rows={3}
                    placeholder="Describe your company..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="about_story">Company Story</Label>
                  <Textarea
                    id="about_story"
                    value={settings.about_story || ''}
                    onChange={(e) => updateSetting('about_story', e.target.value)}
                    rows={6}
                    placeholder="Tell your company's story..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="about_years_experience">Years of Experience</Label>
                    <Input
                      id="about_years_experience"
                      value={settings.about_years_experience || ''}
                      onChange={(e) => updateSetting('about_years_experience', e.target.value)}
                      placeholder="5+"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="about_projects_completed">Projects Completed</Label>
                    <Input
                      id="about_projects_completed"
                      value={settings.about_projects_completed || ''}
                      onChange={(e) => updateSetting('about_projects_completed', e.target.value)}
                      placeholder="200+"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>About Page Image</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ImageUpload
                      value={settings.about_image_url || ''}
                      onChange={(url) => updateSetting('about_image_url', url)}
                      onUpload={uploadAboutImage}
                      isUploading={isUploadingAbout}
                      aspectRatio="video"
                    />
                    <div className="space-y-2">
                      <Label htmlFor="about_image_url">Or enter image URL</Label>
                      <Input
                        id="about_image_url"
                        value={settings.about_image_url || ''}
                        onChange={(e) => updateSetting('about_image_url', e.target.value)}
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Team Members Tab */}
            <TabsContent value="team" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">Team Members</h2>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={resetMemberForm}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Team Member
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>
                        {editingMember ? 'Edit Team Member' : 'Add Team Member'}
                      </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleMemberSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="member_name">Name</Label>
                          <Input
                            id="member_name"
                            value={memberForm.name}
                            onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="member_role">Role / Position</Label>
                          <Input
                            id="member_role"
                            value={memberForm.role}
                            onChange={(e) => setMemberForm({ ...memberForm, role: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="member_bio">Bio</Label>
                        <Textarea
                          id="member_bio"
                          value={memberForm.bio}
                          onChange={(e) => setMemberForm({ ...memberForm, bio: e.target.value })}
                          rows={3}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Photo</Label>
                        <ImageUpload
                          value={memberForm.image_url}
                          onChange={(url) => setMemberForm({ ...memberForm, image_url: url })}
                          onUpload={uploadMemberImage}
                          isUploading={isUploadingMember}
                          aspectRatio="square"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="member_order">Display Order</Label>
                          <Input
                            id="member_order"
                            type="number"
                            value={memberForm.display_order}
                            onChange={(e) => setMemberForm({ ...memberForm, display_order: parseInt(e.target.value) || 0 })}
                          />
                        </div>
                        <div className="flex items-center gap-3 pt-6">
                          <Switch
                            checked={memberForm.is_active}
                            onCheckedChange={(checked) => setMemberForm({ ...memberForm, is_active: checked })}
                          />
                          <Label>Active</Label>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={resetMemberForm}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={saveMemberMutation.isPending}>
                          {saveMemberMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                          {editingMember ? 'Update' : 'Add'} Member
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {teamMembers.length === 0 ? (
                <div className="text-center py-12 bg-card border border-border rounded-xl">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No team members yet</h3>
                  <p className="text-muted-foreground">Add your first team member to display on the About page.</p>
                </div>
              ) : (
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order</TableHead>
                        <TableHead>Photo</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {teamMembers.map((member) => (
                        <TableRow key={member.id}>
                          <TableCell>{member.display_order}</TableCell>
                          <TableCell>
                            <img
                              src={member.image_url || 'https://via.placeholder.com/40'}
                              alt={member.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          </TableCell>
                          <TableCell className="font-medium">{member.name}</TableCell>
                          <TableCell className="text-muted-foreground">{member.role}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              member.is_active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                            }`}>
                              {member.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button size="icon" variant="ghost" onClick={() => handleEditMember(member)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="text-destructive hover:text-destructive"
                                onClick={() => deleteMemberMutation.mutate(member.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
};

export default AboutPage;
