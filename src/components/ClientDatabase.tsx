import React, { useState } from 'react';
import { Search, Filter, MoreVertical, History, Star, Phone, Calendar, MessageSquare, Award, CheckCircle2, UserCheck, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';

interface ClientDatabaseProps {
  clients: any[];
  setClients: React.Dispatch<React.SetStateAction<any[]>>;
  transactions: any[];
}

export default function ClientDatabase({ clients, setClients, transactions }: ClientDatabaseProps) {
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [visitStatus, setVisitStatus] = useState('');
  const [retentionFilter, setRetentionFilter] = useState<'all' | 'inactive30' | 'inactive60'>('all');

  const [isAdjustmentOpen, setIsAdjustmentOpen] = useState(false);
  const [adjustmentClient, setAdjustmentClient] = useState<any>(null);
  const [adjustmentValue, setAdjustmentValue] = useState('');

  const handleSaveAdjustment = () => {
    if (!adjustmentClient) return;
    const value = Math.max(0, Number(adjustmentValue) || 0);

    setClients(prev => prev.map(c => {
      if (c.id === adjustmentClient.id) {
        const updated = { ...c, dueAmount: value };
        if (selectedClient && selectedClient.id === c.id) {
          setSelectedClient(updated);
        }
        return updated;
      }
      return c;
    }));

    setIsAdjustmentOpen(false);
    setAdjustmentClient(null);
    setAdjustmentValue('');
  };

  const getDaysSinceLastVisit = (lastVisitDate: string) => {
    if (!lastVisitDate || lastVisitDate === 'N/A' || lastVisitDate === 'N/A ') return null;
    const lastVisit = new Date(lastVisitDate);
    const today = new Date();
    lastVisit.setHours(0,0,0,0);
    today.setHours(0,0,0,0);
    const diffTime = today.getTime() - lastVisit.getTime();
    if (diffTime < 0) return 0;
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };


  const renderClientDetail = (client: any) => {
    return (
      <div className="flex flex-col min-h-full">
        <div className="p-8 text-center border-b border-border">
          <div className="w-24 h-24 rounded-full bg-accent mx-auto flex items-center justify-center text-white text-3xl font-bold mb-4 shadow-lg shadow-accent/20">
            {client.name.split(' ').map((n: string) => n[0]).join('')}
          </div>
          <h3 className="text-2xl font-bold">{client.name}</h3>
          <p className="text-muted text-sm mt-1">{client.phone}</p>
          <div className="flex justify-center gap-3 mt-6">
            <button
              onClick={() => handleCall(client.phone)}
              className="p-3 bg-surface rounded-2xl border border-border text-accent hover:bg-accent hover:text-white transition-all"
              title="Call Customer"
            >
              <Phone size={20} />
            </button>
            <button
              onClick={() => handleWhatsApp(client.phone)}
              className="p-3 bg-surface rounded-2xl border border-border text-green-500 hover:bg-green-500 hover:text-white transition-all"
              title="WhatsApp Customer"
            >
              <MessageSquare size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-8 flex-1">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-surface p-4 rounded-2xl border border-border">
              <p className="text-[10px] text-muted uppercase font-bold tracking-widest mb-1">Total Visits</p>
              <p className="text-xl font-bold">{client.visits || 0}</p>
            </div>
            <div className="bg-surface p-4 rounded-2xl border border-border">
              <p className="text-[10px] text-muted uppercase font-bold tracking-widest mb-1">Loyalty Points</p>
              <p className="text-xl font-bold text-accent">{client.points || 0}</p>
            </div>
            <div className="bg-surface p-4 rounded-2xl border border-border col-span-2">
              <p className="text-[10px] text-muted uppercase font-bold tracking-widest mb-1">Total Revenue Generated</p>
              <p className="text-xl font-bold text-accent">₹{(client.totalSpent || 0).toLocaleString()}</p>
            </div>
            <div className={`p-4 rounded-2xl border col-span-2 flex items-center justify-between gap-3 ${
              client.dueAmount && client.dueAmount > 0 
                ? 'bg-red-500/5 border-red-500/20' 
                : 'bg-surface border-border'
            }`}>
              <div>
                <p className="text-[10px] text-muted uppercase font-bold tracking-widest mb-1">Outstanding Balance (Dues)</p>
                <p className={`text-xl font-bold ${client.dueAmount && client.dueAmount > 0 ? 'text-red-500' : 'text-white'}`}>
                  ₹{(client.dueAmount || 0).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => {
                  setAdjustmentClient(client);
                  setAdjustmentValue((client.dueAmount || 0).toString());
                  setIsAdjustmentOpen(true);
                }}
                className="px-4 py-2.5 bg-surface hover:bg-surface-hover border border-border rounded-xl text-xs font-bold transition-all text-white flex items-center justify-center gap-1.5"
              >
                <span>Adjust Dues</span>
              </button>
            </div>
          </div>

          {/* Visit History */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest text-muted flex items-center gap-2">
              <History size={14} />
              Transaction History
            </h4>
            <div className="space-y-3 pb-4 max-h-[250px] overflow-y-auto pr-1 custom-scrollbar">
              {transactions
                .filter(tx => tx.phone === client.phone)
                .map((tx, idx) => (
                  <div key={idx} className="p-4 bg-surface-hover rounded-2xl border border-border">
                    <div className="flex justify-between mb-1">
                      <p className="font-bold text-sm">{tx.services}</p>
                      <p className="text-xs text-muted">{tx.date}</p>
                    </div>
                    <p className="text-xs text-accent font-semibold">₹{tx.total.toLocaleString()} • Staff: {tx.staffNames}</p>
                  </div>
                ))}
              {transactions.filter(tx => tx.phone === client.phone).length === 0 && (
                <p className="text-xs text-muted italic text-center py-4">No billing logs found for this customer.</p>
              )}
            </div>
          </div>
        </div>

        {(() => {
          const days = getDaysSinceLastVisit(client.lastVisit);
          if (days !== null && days >= 30) {
            return (
              <div className="p-6 bg-surface/50 border-t border-border mt-auto space-y-3">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => sendReengagementAlert(client)}
                  className="w-full bg-green-500/10 text-green-500 border border-green-500/30 py-4 rounded-2xl font-bold hover:bg-green-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <MessageSquare size={18} />
                  Send {days >= 60 ? '60-Day' : '30-Day'} Retention Message
                </motion.button>
              </div>
            );
          }
          return null;
        })()}
      </div>
    );
  };

  const filteredClients = clients.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.phone.includes(searchTerm);
    if (!matchesSearch) return false;

    if (retentionFilter === 'inactive30') {
      const days = getDaysSinceLastVisit(c.lastVisit);
      return days !== null && days >= 30;
    }
    if (retentionFilter === 'inactive60') {
      const days = getDaysSinceLastVisit(c.lastVisit);
      return days !== null && days >= 60;
    }

    return true;
  });


  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const handleWhatsApp = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}`, '_blank');
  };

  const simulateVisit = async (name: string) => {
    if (!selectedClient) return;
    setVisitStatus(`Processing visit for ${name}...`);

    // Trigger WhatsApp Automation via MSG91
    try {
      const response = await fetch('/api/automation/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'visit_completed',
          customer: { name, phone: selectedClient.phone },
          template_id: 'pos_checkout_confirmation',
          variables: ["500", "Salon Service"]

        })
      });
      if (response.ok) {
        setVisitStatus(`WhatsApp message triggered for ${name}!`);
      } else {
        setVisitStatus(`Failed to trigger WhatsApp for ${name}`);
      }
    } catch (e) {
      setVisitStatus(`Visit recorded for ${name}`);
    }

    // Update visits in Supabase
    supabase.from('clients').upsert({
      id: selectedClient.id,
      name: selectedClient.name,
      phone: selectedClient.phone,
      total_visits: (selectedClient.visits || 0) + 1,
      total_spent: selectedClient.totalSpent || 0,
      last_visit: new Date().toISOString().split('T')[0]
    }).then(({ error }) => {
      if (error) console.error("Failed to sync manual visit to Supabase:", error);
    });

    // Update visits in parent state
    setClients(prevClients => prevClients.map(c => {
      if (c.id === selectedClient.id) {
        return {
          ...c,
          visits: (c.visits || 0) + 1,
          lastVisit: new Date().toISOString().split('T')[0],
          last30DayReminderCycle: 'pending',
          last60DayReminderCycle: 'pending'
        };
      }
      return c;
    }));

    setTimeout(() => {
      setVisitStatus('');
    }, 3000);
  };

  const sendReengagementAlert = async (client: any) => {
    const days = getDaysSinceLastVisit(client.lastVisit) || 30;
    const daysStr = days.toString();
    const clientTxs = transactions.filter(tx => tx.phone === client.phone);
    const lastTx = clientTxs[clientTxs.length - 1];
    const lastService = lastTx ? lastTx.services : "service";

    setVisitStatus(`Sending re-engagement WhatsApp to ${client.name}...`);

    try {
      const response = await fetch('/api/automation/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'visit_completed',
          customer: { name: client.name, phone: client.phone },
          template_id: 'appointment_follow_up_upsell',
          variables: [daysStr, lastService]


        })
      });
      if (response.ok) {
        setVisitStatus(`Re-engagement WhatsApp sent to ${client.name}!`);
      } else {
        setVisitStatus(`Failed to send WhatsApp for ${client.name}`);
      }
    } catch (e) {
      setVisitStatus(`Failed to send WhatsApp for ${client.name}`);
    }

    setTimeout(() => {
      setVisitStatus('');
    }, 3000);
  };


  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ease: [0.22, 1, 0.36, 1], duration: 0.6 }}
      className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full relative pb-8"
    >
      {/* Toast Alert */}
      <AnimatePresence>
        {visitStatus && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-8 right-8 z-[100] bg-surface border border-accent/30 p-6 rounded-2xl shadow-2xl max-w-sm"
          >
            <div className="flex items-start gap-4">
              <div className="bg-accent/20 p-2 rounded-lg">
                <MessageSquare className="text-accent" size={24} />
              </div>
              <div>
                <h4 className="font-bold text-sm">WhatsApp Automation</h4>
                <p className="text-xs text-muted mt-1">
                  {visitStatus}
                </p>
                <div className="mt-3 h-1 w-full bg-border rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 3 }}
                    className="h-full bg-accent"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Client List */}
      <div className="lg:col-span-2 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Client Base</h1>
          <div className="flex gap-2">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
              <input
                type="text"
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-surface border border-border rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none"
              />
            </div>
            <select
              value={retentionFilter}
              onChange={(e) => setRetentionFilter(e.target.value as any)}
              className="bg-surface border border-border rounded-xl py-2 px-4 text-sm focus:outline-none text-white cursor-pointer hover:border-accent/40 transition-colors"
            >
              <option value="all">All Clients</option>
              <option value="inactive30">Inactive (30+ Days)</option>
              <option value="inactive60">Inactive (60+ Days)</option>
            </select>
          </div>
        </div>

        <div className="glass rounded-[2rem] overflow-hidden">
          <div className="overflow-x-auto">
            {filteredClients.length > 0 ? (
              <table className="w-full text-left">
                <thead className="bg-surface/50 text-muted text-xs uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Client</th>
                    <th className="px-6 py-4 font-semibold">Visits</th>
                    <th className="px-6 py-4 font-semibold">Last Visit</th>
                    <th className="px-6 py-4 font-semibold">Points</th>
                    <th className="px-6 py-4 font-semibold">Outstanding</th>
                    <th className="px-6 py-4 font-semibold">Total Spent</th>
                    <th className="px-6 py-4 font-semibold"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredClients.map((client) => (
                    <tr
                      key={client.id}
                      onClick={() => setSelectedClient(client)}
                      className={`hover:bg-surface/30 transition-colors cursor-pointer group ${selectedClient?.id === client.id ? 'bg-accent/5 border-l-2 border-accent' : ''
                        }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center font-bold text-accent">
                            {client.name.split(' ').map((n: string) => n[0]).join('')}
                          </div>
                          <div>
                            <p className="font-bold">{client.name}</p>
                            <p className="text-xs text-muted">{client.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold">{client.visits || 0}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <p className="font-medium text-white">{client.lastVisit || 'N/A'}</p>
                          {(() => {
                            const days = getDaysSinceLastVisit(client.lastVisit);
                            return days !== null && days >= 30 ? (
                              <p className="text-[10px] text-red-500 font-bold uppercase tracking-wide mt-0.5">{days} days inactive</p>
                            ) : null;
                          })()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-accent">
                          <Award size={14} />
                          <span className="font-bold">{client.points || 0}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {client.dueAmount && client.dueAmount > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-500 border border-red-500/20">
                            ₹{client.dueAmount.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-muted/50 text-sm">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-bold text-accent">₹{(client.totalSpent || 0).toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <button className="p-2 text-muted hover:text-white">
                          <MoreVertical size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-muted">No clients in database. Add new clients via POS checkout to build your base.</div>
            )}
          </div>
        </div>
      </div>

      {/* Client Detail Sidebar */}
      <div className="hidden lg:flex glass rounded-[2rem] flex-col overflow-y-auto custom-scrollbar max-h-[calc(100vh-8rem)]">
        {selectedClient ? renderClientDetail(selectedClient) : (
          <div className="h-full flex flex-col items-center justify-center text-muted p-12 text-center space-y-4">
            <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center">
              <UserCircle size={40} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">No Client Selected</h3>
              <p className="text-sm mt-2">Select a client from the list to view their detailed profile and history.</p>
            </div>
          </div>
        )}
      </div>

      {/* Client Detail Bottom Sheet Drawer for Mobile */}
      <AnimatePresence>
        {selectedClient && (
          <div className="lg:hidden fixed inset-0 z-[100] flex items-end justify-center">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedClient(null)}
              className="absolute inset-0 bg-black/85 backdrop-blur-sm"
            />
            {/* Sheet */}
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full bg-surface border-t border-border rounded-t-[2.5rem] p-6 max-h-[85vh] overflow-y-auto z-10 flex flex-col"
            >
              <div className="flex justify-end mb-2 flex-shrink-0">
                <button 
                  type="button" 
                  onClick={() => setSelectedClient(null)} 
                  className="text-muted hover:text-white p-2"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {renderClientDetail(selectedClient)}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Manual Dues Adjustment Modal */}
      <AnimatePresence>
        {isAdjustmentOpen && adjustmentClient && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAdjustmentOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-sm glass rounded-[2rem] p-8 space-y-6"
            >
              <h3 className="text-xl font-bold">Adjust Dues: {adjustmentClient.name}</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-muted mb-2 block">Outstanding Due Amount (₹)</label>
                  <input 
                    type="number" 
                    value={adjustmentValue}
                    onChange={(e) => setAdjustmentValue(e.target.value)}
                    placeholder="0"
                    className="w-full bg-surface border border-border rounded-xl py-3 px-4 focus:outline-none focus:border-accent/50 text-white"
                  />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button 
                  onClick={handleSaveAdjustment}
                  className="flex-1 bg-accent text-white py-3 rounded-xl font-bold hover:opacity-90 transition-all"
                >
                  Save
                </button>
                <button 
                  onClick={() => setIsAdjustmentOpen(false)}
                  className="flex-1 py-3 rounded-xl font-bold text-muted hover:text-white transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function UserCircle({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
