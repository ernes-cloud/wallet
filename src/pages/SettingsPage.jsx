import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Save, Loader2, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';

const SettingsPage = () => {
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    preferred_currency: 'USD',
    eodhd_api_key: ''
  });

  useEffect(() => {
    if (user) {
      loadSettings();
    }
  }, [user]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_preferences')
        .select('preferred_currency, eodhd_api_key')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings({
          preferred_currency: data.preferred_currency || 'USD',
          eodhd_api_key: data.eodhd_api_key || ''
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: "Error loading settings",
        description: "Could not load your preferences.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('user_preferences')
        .upsert({ 
          user_id: user.id, 
          preferred_currency: settings.preferred_currency,
          eodhd_api_key: settings.eodhd_api_key
        }, { onConflict: 'user_id' });

      if (error) throw error;

      toast({
        title: "Settings saved",
        description: "Your preferences have been updated successfully."
      });
      
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error saving settings",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <Helmet>
        <title>Settings - WealthFlow</title>
      </Helmet>

      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Settings</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">Manage your account preferences and integrations.</p>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 space-y-6 shadow-sm">
        
        {/* Currency Selection */}
        <div className="space-y-3">
          <label className="text-base font-semibold text-slate-900 dark:text-white block">
            Preferred Currency
          </label>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            This currency will be used to display all portfolio values across the dashboard.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {['USD', 'EUR', 'GBP', 'JPY'].map((currency) => (
              <button
                key={currency}
                onClick={() => setSettings({ ...settings, preferred_currency: currency })}
                className={`px-4 py-3 rounded-lg border text-sm font-medium transition-all ${
                  settings.preferred_currency === currency
                    ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-500'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600'
                }`}
              >
                {currency}
              </button>
            ))}
          </div>
        </div>

        <hr className="border-slate-200 dark:border-slate-700" />

        {/* API Integration */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-slate-500" />
            <label className="text-base font-semibold text-slate-900 dark:text-white block">
              EODHD API Key
            </label>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Required for real-time stock prices, historical data, and fundamentals. Get a free key at <a href="https://eodhd.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">eodhd.com</a>.
          </p>
          <input
            type="password"
            value={settings.eodhd_api_key}
            onChange={(e) => setSettings({ ...settings, eodhd_api_key: e.target.value })}
            placeholder="Enter your EODHD API Key (e.g. demo or your key)"
            className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>

        <div className="pt-4 flex justify-end">
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </Button>
        </div>

      </div>
    </div>
  );
};

export default SettingsPage;