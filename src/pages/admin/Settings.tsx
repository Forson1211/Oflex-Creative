import { AdminLayout } from '@/components/admin/AdminLayout';
import { ProtectedRoute } from '@/components/admin/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings as SettingsIcon, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Settings = () => {
  const { toast } = useToast();

  const handleSave = () => {
    toast({
      title: 'Settings Saved',
      description: 'Your settings have been saved successfully.',
    });
  };

  return (
    <ProtectedRoute requireAdmin>
      <AdminLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Settings</h1>
            <p className="text-muted-foreground">Configure your store settings</p>
          </div>

          <div className="grid gap-6">
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <SettingsIcon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">General Settings</h2>
                  <p className="text-sm text-muted-foreground">Basic store configuration</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="storeName">Store Name</Label>
                    <Input id="storeName" defaultValue="Cre8ive" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="storeEmail">Store Email</Label>
                    <Input id="storeEmail" type="email" defaultValue="hello@cre8ive.com" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="storeDescription">Store Description</Label>
                  <Input
                    id="storeDescription"
                    defaultValue="Premium digital products for creatives"
                  />
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Payment Settings</h2>
              <p className="text-muted-foreground text-sm mb-4">
                Configure your payment provider settings. Stripe integration is available for
                processing payments.
              </p>
              <div className="p-4 rounded-lg bg-accent border border-border">
                <p className="text-sm text-accent-foreground">
                  Payment processing will be configured once Stripe is connected.
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Save Settings
              </Button>
            </div>
          </div>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
};

export default Settings;
