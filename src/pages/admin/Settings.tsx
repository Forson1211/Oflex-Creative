import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ProtectedRoute } from '@/components/admin/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Settings as SettingsIcon, Save, Loader2, CreditCard, Bell, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SiteSetting {
  id: string;
  setting_key: string;
  setting_value: string | null;
}

const Settings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<Record<string, string>>({});

  const { data: siteSettings = [], isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      const { data, error } = await supabase.from('site_settings').select('*');
      if (error) throw error;
      return data as SiteSetting[];
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

  const saveMutation = useMutation({
    mutationFn: async () => {
      const updates = Object.entries(settings).map(([key, value]) => ({
        setting_key: key,
        setting_value: value,
      }));

      for (const update of updates) {
        const existing = siteSettings.find(s => s.setting_key === update.setting_key);
        if (existing) {
          const { error } = await supabase
            .from('site_settings')
            .update({ setting_value: update.setting_value })
            .eq('setting_key', update.setting_key);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('site_settings')
            .insert({ setting_key: update.setting_key, setting_value: update.setting_value });
          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      toast({ title: 'Settings saved successfully!' });
    },
    onError: () => {
      toast({ title: 'Error saving settings', variant: 'destructive' });
    },
  });

  const updateSetting = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    saveMutation.mutate();
  };

  if (isLoading) {
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
              <h1 className="text-2xl font-bold text-foreground">Settings</h1>
              <p className="text-muted-foreground">Configure your store settings</p>
            </div>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Settings
            </Button>
          </div>

          <div className="grid gap-6">
            {/* General Settings */}
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
                    <Label htmlFor="store_name">Store Name</Label>
                    <Input
                      id="store_name"
                      value={settings.site_name || ''}
                      onChange={(e) => updateSetting('site_name', e.target.value)}
                      placeholder="Your Store Name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="store_email">Store Email</Label>
                    <Input
                      id="store_email"
                      type="email"
                      value={settings.contact_email || ''}
                      onChange={(e) => updateSetting('contact_email', e.target.value)}
                      placeholder="contact@yourstore.com"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="store_description">Store Description</Label>
                  <Input
                    id="store_description"
                    value={settings.site_tagline || ''}
                    onChange={(e) => updateSetting('site_tagline', e.target.value)}
                    placeholder="Premium digital products for creatives"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency Symbol</Label>
                  <Input
                    id="currency"
                    value={settings.currency_symbol || '$'}
                    onChange={(e) => updateSetting('currency_symbol', e.target.value)}
                    placeholder="$"
                    className="w-24"
                  />
                </div>
              </div>
            </div>

            {/* Payment Settings */}
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Payment Settings</h2>
                  <p className="text-sm text-muted-foreground">Configure payment methods</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                  <div>
                    <p className="font-medium text-foreground">PayPal</p>
                    <p className="text-sm text-muted-foreground">Accept PayPal payments</p>
                  </div>
                  <Switch
                    checked={settings.payment_paypal === 'true'}
                    onCheckedChange={(checked) => updateSetting('payment_paypal', checked.toString())}
                  />
                </div>
                {settings.payment_paypal === 'true' && (
                  <div className="space-y-2 ml-4">
                    <Label htmlFor="paypal_email">PayPal Email</Label>
                    <Input
                      id="paypal_email"
                      type="email"
                      value={settings.paypal_email || ''}
                      onChange={(e) => updateSetting('paypal_email', e.target.value)}
                      placeholder="your-paypal@email.com"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                  <div>
                    <p className="font-medium text-foreground">Paystack</p>
                    <p className="text-sm text-muted-foreground">Accept Paystack payments (Africa)</p>
                  </div>
                  <Switch
                    checked={settings.payment_paystack === 'true'}
                    onCheckedChange={(checked) => updateSetting('payment_paystack', checked.toString())}
                  />
                </div>
                {settings.payment_paystack === 'true' && (
                  <div className="space-y-2 ml-4">
                    <Label htmlFor="paystack_public_key">Paystack Public Key</Label>
                    <Input
                      id="paystack_public_key"
                      value={settings.paystack_public_key || ''}
                      onChange={(e) => updateSetting('paystack_public_key', e.target.value)}
                      placeholder="pk_live_..."
                    />
                  </div>
                )}

                <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                  <div>
                    <p className="font-medium text-foreground">Bank Transfer</p>
                    <p className="text-sm text-muted-foreground">Accept direct bank transfers</p>
                  </div>
                  <Switch
                    checked={settings.payment_bank === 'true'}
                    onCheckedChange={(checked) => updateSetting('payment_bank', checked.toString())}
                  />
                </div>
                {settings.payment_bank === 'true' && (
                  <div className="space-y-2 ml-4">
                    <Label htmlFor="bank_details">Bank Account Details</Label>
                    <Input
                      id="bank_details"
                      value={settings.bank_details || ''}
                      onChange={(e) => updateSetting('bank_details', e.target.value)}
                      placeholder="Bank Name - Account Number - Account Name"
                    />
                  </div>
                )}

                <div className="p-4 rounded-lg bg-accent border border-border">
                  <p className="text-sm text-accent-foreground">
                    💡 To enable card payments via Stripe, please enable the Stripe integration from the project settings.
                  </p>
                </div>
              </div>
            </div>

            {/* Notification Settings */}
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Notifications</h2>
                  <p className="text-sm text-muted-foreground">Configure email notifications</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                  <div>
                    <p className="font-medium text-foreground">Order Notifications</p>
                    <p className="text-sm text-muted-foreground">Receive email when a new order is placed</p>
                  </div>
                  <Switch
                    checked={settings.notify_orders === 'true'}
                    onCheckedChange={(checked) => updateSetting('notify_orders', checked.toString())}
                  />
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                  <div>
                    <p className="font-medium text-foreground">New User Notifications</p>
                    <p className="text-sm text-muted-foreground">Receive email when a new user signs up</p>
                  </div>
                  <Switch
                    checked={settings.notify_users === 'true'}
                    onCheckedChange={(checked) => updateSetting('notify_users', checked.toString())}
                  />
                </div>
              </div>
            </div>

            {/* Security Settings */}
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Security</h2>
                  <p className="text-sm text-muted-foreground">Manage security settings</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                  <div>
                    <p className="font-medium text-foreground">Maintenance Mode</p>
                    <p className="text-sm text-muted-foreground">Temporarily disable the site for visitors</p>
                  </div>
                  <Switch
                    checked={settings.maintenance_mode === 'true'}
                    onCheckedChange={(checked) => updateSetting('maintenance_mode', checked.toString())}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
};

export default Settings;
