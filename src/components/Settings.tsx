import React, { useState } from 'react';
import { 
  Target, 
  QrCode, 
  Save,
  CheckCircle2,
  Loader2,
  Trash2
} from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';

interface SettingsProps {
  settings: any;
  setSettings: React.Dispatch<React.SetStateAction<any>>;
}

export default function Settings({ settings, setSettings }: SettingsProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleResetDatabase = async () => {
    if (!confirm("Are you sure you want to delete all clients, staff, appointments, and transactions? This cannot be undone.")) {
      return;
    }
    
    // Clear local storage
    localStorage.removeItem('trendz_clients');
    localStorage.removeItem('trendz_staff');
    localStorage.removeItem('trendz_appointments');
    localStorage.removeItem('trendz_transactions');
    localStorage.removeItem('trendz_services');
    localStorage.removeItem('trendz_settings');

    
    // Attempt to delete remote Supabase rows
    try {
      const { error: err1 } = await supabase.from('appointments').delete().neq('id', '');
      const { error: err2 } = await supabase.from('transactions').delete().neq('id', '');
      const { error: err3 } = await supabase.from('clients').delete().neq('id', '');
      const { error: err4 } = await supabase.from('staff').delete().neq('id', '');
      
      if (err1 || err2 || err3 || err4) {
        alert("Local data cleared! (Note: Remote Supabase database might need dashboard access to clear depending on RLS rules).");
      } else {
        alert("All local and remote data successfully cleared!");
      }
    } catch (e) {
      alert("Local data cleared successfully!");
    }
    
    window.location.reload();
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    }, 800);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ ease: [0.22, 1, 0.36, 1], duration: 0.6 }}
      className="max-w-3xl mx-auto space-y-8 pb-12"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted">Manage your salon configuration</p>
        </div>
        <motion.button 
          whileTap={{ scale: 0.95 }}
          onClick={handleSave}
          disabled={isSaving}
          className={`px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg ${
            isSaved ? 'bg-green-500 text-white shadow-green-500/20' : 'bg-accent text-white shadow-accent/20 hover:opacity-90'
          }`}
        >
          {isSaving ? (
            <Loader2 size={18} className="animate-spin" />
          ) : isSaved ? (
            <CheckCircle2 size={18} />
          ) : (
            <Save size={18} />
          )}
          {isSaving ? 'Saving...' : isSaved ? 'Saved!' : 'Save Changes'}
        </motion.button>
      </div>

      {/* Salon Configuration Card */}
      <div className="glass rounded-[2rem] p-8 space-y-6">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Target className="text-accent" size={24} />
          Salon Configuration
        </h3>
        <div className="space-y-6">
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-muted mb-2 block">Monthly Revenue Goal (₹)</label>
            <input 
              type="text" 
              value={settings.revenueGoal}
              onChange={(e) => setSettings({...settings, revenueGoal: e.target.value})}
              className="w-full bg-surface border border-border rounded-xl py-3 px-4 focus:outline-none focus:border-accent/50 transition-all text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-muted mb-2 block">UPI ID for QR Code</label>
            <div className="relative">
              <QrCode className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
              <input 
                type="text" 
                value={settings.upiId}
                onChange={(e) => setSettings({...settings, upiId: e.target.value})}
                className="w-full bg-surface border border-border rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-accent/50 transition-all text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-muted mb-2 block">Loyalty Points (Points per ₹100)</label>
              <input 
                type="number" 
                value={settings.loyaltyPointsPerRupee}
                onChange={(e) => setSettings({...settings, loyaltyPointsPerRupee: e.target.value})}
                className="w-full bg-surface border border-border rounded-xl py-3 px-4 focus:outline-none focus:border-accent/50 transition-all text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-muted mb-2 block">Default WhatsApp Cap</label>
              <input 
                type="number" 
                value={settings.defaultMessageCap}
                onChange={(e) => setSettings({...settings, defaultMessageCap: e.target.value})}
                className="w-full bg-surface border border-border rounded-xl py-3 px-4 focus:outline-none focus:border-accent/50 transition-all text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone Card */}
      <div className="glass rounded-[2rem] p-8 space-y-6 border border-red-500/20 bg-red-500/5">
        <h3 className="text-xl font-bold flex items-center gap-2 text-red-500">
          <Trash2 className="text-red-500" size={24} />
          Danger Zone
        </h3>
        <p className="text-xs text-muted leading-relaxed">
          Wipe all records including clients, staff, appointments, and checkout transactions. This will clear both your browser storage and attempt to clear connected Supabase tables.
        </p>
        <button 
          type="button"
          onClick={handleResetDatabase}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-xl text-xs transition-all shadow-lg shadow-red-600/20"
        >
          Reset All Salon Data
        </button>
      </div>
    </motion.div>
  );
}
