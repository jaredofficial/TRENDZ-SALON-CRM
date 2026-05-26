import React, { useState } from 'react';
import { Search, Filter, MoreVertical, History, Star, Phone, Calendar, MessageSquare, Award, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { customers } from '../data/mockData';

export default function ClientDatabase({ branchId }: { branchId: string }) {
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [visitStatus, setVisitStatus] = useState('');

  const branchClients = customers.filter(c => c.branchId === branchId);
  const filteredClients = branchClients.filter(c =>
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
    setVisitStatus(`Processing visit for ${name}...`);

    // Trigger WhatsApp Automation via MSG91
    try {
      const response = await fetch('/api/automation/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'visit_completed',
          customer: { name, phone: selectedClient.phone }, // Use actual client's phone number
          template_id: 'appointment_confirmed_wa_text_v1',
          variables: ["Aion Salon", "500", new Date().toLocaleDateString()]
        })
      });
      if (response.ok) {
        setVisitStatus(`WhatsApp sent to ${name}!`);
      } else {
        setVisitStatus(`Failed to send WhatsApp to ${name}`);
      }
    } catch (e) {
      setVisitStatus(`Visit recorded for ${name}`);
    }

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
      {/* Demo Toast */}
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
                <p className="text-[10px] text-accent mt-2 flex items-center gap-1">
                  <CheckCircle2 size={10} />
                  Message Cap Check: 3/5 used
                </p>
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
            <button className="p-2 bg-surface border border-border rounded-xl text-muted hover:text-white">
              <Filter size={20} />
            </button>
          </div>
        </div>

        <div className="glass rounded-[2rem] overflow-hidden">
          <div className="overflow-x-auto">
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
                          {client.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <p className="font-bold">{client.name}</p>
                          <p className="text-xs text-muted">{client.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold">{client.visits}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 text-accent">
                        <Award size={14} />
                        <span className="font-bold">{client.points}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-accent">₹{client.totalSpent.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <button className="p-2 text-muted hover:text-white">
                        <MoreVertical size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Client Detail Sidebar */}
      <div className="glass rounded-[2rem] flex flex-col overflow-y-auto custom-scrollbar max-h-[calc(100vh-8rem)]">
        {selectedClient ? (
          <motion.div
            key={selectedClient.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col min-h-full"
          >
            <div className="p-8 text-center border-b border-border">
              <div className="w-24 h-24 rounded-full bg-accent mx-auto flex items-center justify-center text-black text-3xl font-bold mb-4 shadow-lg shadow-accent/20">
                {selectedClient.name.split(' ').map((n: string) => n[0]).join('')}
              </div>
              <h3 className="text-2xl font-bold">{selectedClient.name}</h3>
              <p className="text-muted text-sm mt-1">{selectedClient.phone}</p>
              <div className="flex justify-center gap-3 mt-6">
                <button
                  onClick={() => handleCall(selectedClient.phone)}
                  className="p-3 bg-surface rounded-2xl border border-border text-accent hover:bg-accent hover:text-black transition-all"
                >
                  <Phone size={20} />
                </button>
                <button
                  onClick={() => handleWhatsApp(selectedClient.phone)}
                  className="p-3 bg-surface rounded-2xl border border-border text-green-500 hover:bg-green-500 hover:text-white transition-all"
                >
                  <MessageSquare size={20} />
                </button>
                <button className="p-3 bg-surface rounded-2xl border border-border text-accent hover:bg-accent hover:text-black transition-all">
                  <Calendar size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-8 flex-1">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface p-4 rounded-2xl border border-border">
                  <p className="text-[10px] text-muted uppercase font-bold tracking-widest mb-1">Total Visits</p>
                  <p className="text-xl font-bold">{selectedClient.visits}</p>
                </div>
                <div className="bg-surface p-4 rounded-2xl border border-border">
                  <p className="text-[10px] text-muted uppercase font-bold tracking-widest mb-1">Loyalty Points</p>
                  <p className="text-xl font-bold text-accent">{selectedClient.points}</p>
                </div>
                <div className="bg-surface p-4 rounded-2xl border border-border col-span-2">
                  <p className="text-[10px] text-muted uppercase font-bold tracking-widest mb-1">Total Revenue Generated</p>
                  <p className="text-xl font-bold text-accent">₹{selectedClient.totalSpent.toLocaleString()}</p>
                </div>
              </div>

              {/* Frequent Services */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-muted flex items-center gap-2">
                  <Star size={14} />
                  Frequent Services
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedClient.frequent.map((s: string, i: number) => (
                    <span key={i} className="px-3 py-1 bg-accent/10 text-accent text-xs font-bold rounded-full border border-accent/20">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Visit History */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-muted flex items-center gap-2">
                  <History size={14} />
                  Recent History
                </h4>
                <div className="space-y-3 pb-4">
                  {[1, 2, 3, 4, 5].map((_, i) => (
                    <div key={i} className="p-4 bg-surface-hover rounded-2xl border border-border">
                      <div className="flex justify-between mb-1">
                        <p className="font-bold text-sm">Haircut & Styling</p>
                        <p className="text-xs text-muted">Mar {25 - i * 5}, 2024</p>
                      </div>
                      <p className="text-xs text-accent font-semibold">₹1,500 • Rahul Sharma</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 bg-surface/50 border-t border-border mt-auto flex gap-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => simulateVisit(selectedClient.name)}
                className="flex-1 bg-accent/10 text-accent border border-accent/30 py-4 rounded-2xl font-bold hover:bg-accent/20 transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 size={18} />
                Complete Visit
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="flex-[2] bg-accent text-accent-foreground py-4 rounded-2xl font-bold hover:opacity-90 transition-all shadow-lg shadow-accent/20"
              >
                Book Appointment
              </motion.button>
            </div>
          </motion.div>
        ) : (
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
