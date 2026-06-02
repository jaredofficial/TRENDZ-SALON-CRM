import React, { useState } from 'react';
import { Search, Filter, MoreVertical, History, Star, Phone, Calendar, MessageSquare, Award, CheckCircle2, UserCheck, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ClientDatabaseProps {
  clients: any[];
  setClients: React.Dispatch<React.SetStateAction<any[]>>;
  transactions: any[];
}

export default function ClientDatabase({ clients, setClients, transactions }: ClientDatabaseProps) {
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [visitStatus, setVisitStatus] = useState('');

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

        <div className="p-6 bg-surface/50 border-t border-border mt-auto">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => simulateVisit(client.name)}
            className="w-full bg-accent/10 text-accent border border-accent/30 py-4 rounded-2xl font-bold hover:bg-accent/20 transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle2 size={18} />
            Send Visit Confirmation Alert
          </motion.button>
        </div>
      </div>
    );
  };

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

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
          template_id: 'appointment_confirmed_wa_text_v1',
          variables: ["Trendz Salon", "500", new Date().toLocaleDateString()]
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

    // Update visits in parent state
    setClients(prevClients => prevClients.map(c => {
      if (c.id === selectedClient.id) {
        return {
          ...c,
          visits: (c.visits || 0) + 1,
          lastVisit: new Date().toISOString().split('T')[0]
        };
      }
      return c;
    }));

    setTimeout(() => {
      setVisitStatus('');
    }, 3000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
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
                    <th className="px-6 py-4 font-semibold">Points</th>
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
                        <div className="flex items-center gap-1 text-accent">
                          <Award size={14} />
                          <span className="font-bold">{client.points || 0}</span>
                        </div>
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
