import React, { useState } from 'react';
import { 
  Users, 
  TrendingUp, 
  Award, 
  Plus, 
  Search,
  Instagram,
  Phone,
  Mail,
  ChevronRight,
  X,
  PieChart,
  Repeat,
  DollarSign,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface StaffTrackingProps {
  staff: any[];
  setStaff: React.Dispatch<React.SetStateAction<any[]>>;
  transactions: any[];
}

export default function StaffTracking({ staff, setStaff, transactions }: StaffTrackingProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newStaff, setNewStaff] = useState({
    name: '',
    phone: '+91',
    role: '',
    email: '',
    instagram: ''
  });

  // Find current month string: YYYY-MM
  const currentMonthStr = new Date().toISOString().substring(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);

  // Helper to extract year-month from date string YYYY-MM-DD
  const getYearMonth = (dateStr: string) => dateStr.substring(0, 7);

  // Get unique months from transactions list
  const transactionMonths = Array.from(new Set(transactions.map(tx => getYearMonth(tx.date))));
  if (!transactionMonths.includes(currentMonthStr)) {
    transactionMonths.push(currentMonthStr);
  }
  transactionMonths.sort((a, b) => b.localeCompare(a)); // Sort descending

  // Compute stats for each staff member (overall and selected month)
  const staffStats = staff.map(member => {
    // Overall stats
    const overallTxs = transactions.filter(tx => tx.staffIds && tx.staffIds.includes(member.id));
    const overallRevenue = overallTxs.reduce((sum, tx) => {
      if (tx.staffRevenueShare && tx.staffRevenueShare[member.id] !== undefined) {
        return sum + tx.staffRevenueShare[member.id];
      }
      return sum + (tx.total / (tx.staffIds.length || 1));
    }, 0);
    const overallClients = overallTxs.length;
    const overallIncentives = overallTxs.reduce((sum, tx) => {
      if (tx.staffIncentives && tx.staffIncentives[member.id] !== undefined) {
        return sum + tx.staffIncentives[member.id];
      }
      return sum + (tx.incentivePerStaff || 0);
    }, 0);

    // Selected month stats
    const monthTxs = overallTxs.filter(tx => getYearMonth(tx.date) === selectedMonth);
    const monthRevenue = monthTxs.reduce((sum, tx) => {
      if (tx.staffRevenueShare && tx.staffRevenueShare[member.id] !== undefined) {
        return sum + tx.staffRevenueShare[member.id];
      }
      return sum + (tx.total / (tx.staffIds.length || 1));
    }, 0);
    const monthClients = monthTxs.length;
    const monthIncentives = monthTxs.reduce((sum, tx) => {
      if (tx.staffIncentives && tx.staffIncentives[member.id] !== undefined) {
        return sum + tx.staffIncentives[member.id];
      }
      return sum + (tx.incentivePerStaff || 0);
    }, 0);

    return {
      ...member,
      revenue: overallRevenue,
      clients: overallClients,
      incentives: overallIncentives,
      monthRevenue,
      monthClients,
      monthIncentives
    };
  });

  // Filter staff by search term
  const filteredStaff = staffStats.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // High-level cards for selected month
  const totalIncentivesThisMonth = staffStats.reduce((sum, s) => sum + s.monthIncentives, 0);
  const totalRevenueThisMonth = transactions
    .filter(tx => getYearMonth(tx.date) === selectedMonth)
    .reduce((sum, tx) => sum + tx.total, 0);
  const totalClientsThisMonth = transactions
    .filter(tx => getYearMonth(tx.date) === selectedMonth).length;

  // Format month name (e.g. "2026-06" to "June 2026")
  const formatMonthName = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(Number(year), Number(month) - 1, 1);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Staff Performance</h1>
          <p className="text-muted">Track and manage your team's incentives and productivity</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Month Selector */}
          <div className="flex items-center gap-2 bg-surface border border-border px-3 py-2 rounded-xl">
            <Calendar size={16} className="text-accent" />
            <select 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-sm font-bold text-white focus:outline-none cursor-pointer"
            >
              {transactionMonths.map(m => (
                <option key={m} value={m} className="bg-surface text-white">
                  {formatMonthName(m)}
                </option>
              ))}
            </select>
          </div>

          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-accent text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:opacity-90 transition-all shadow-lg shadow-accent/20"
          >
            <Plus size={20} />
            Add Staff Member
          </button>
        </div>
      </div>

      {/* Dynamic Performance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass p-6 rounded-3xl border-l-4 border-accent">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-accent/10 rounded-2xl text-accent">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted">Month Revenue (Share)</p>
              <p className="text-[10px] text-muted">{formatMonthName(selectedMonth)}</p>
            </div>
          </div>
          <p className="text-3xl font-bold">₹{totalRevenueThisMonth.toLocaleString()}</p>
        </div>
        
        {/* Incentives Card (Replaces Highest Rated Card) */}
        <div className="glass p-6 rounded-3xl border-l-4 border-red-500">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-red-500/10 rounded-2xl text-red-500">
              <DollarSign size={24} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted">Incentives Distributed (5%)</p>
              <p className="text-[10px] text-muted">{formatMonthName(selectedMonth)}</p>
            </div>
          </div>
          <p className="text-3xl font-bold text-accent">₹{totalIncentivesThisMonth.toLocaleString()}</p>
        </div>

        <div className="glass p-6 rounded-3xl border-l-4 border-purple-500">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-purple-500/10 rounded-2xl text-purple-500">
              <Users size={24} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-muted">Total Clients Served</p>
              <p className="text-[10px] text-muted">{formatMonthName(selectedMonth)}</p>
            </div>
          </div>
          <p className="text-3xl font-bold">{totalClientsThisMonth}</p>
        </div>
      </div>

      {/* Staff Directory Table */}
      <div className="glass rounded-[2.5rem] overflow-hidden">
        <div className="p-8 border-b border-border flex items-center justify-between">
          <h3 className="text-xl font-bold">Team Directory & Incentives</h3>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
            <input 
              type="text" 
              placeholder="Search staff..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-surface border border-border rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          {filteredStaff.length > 0 ? (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-8 py-4 text-xs font-bold uppercase tracking-widest text-muted">Staff Member</th>
                  <th className="px-8 py-4 text-xs font-bold uppercase tracking-widest text-muted">Role</th>
                  <th className="px-8 py-4 text-xs font-bold uppercase tracking-widest text-muted">Month Revenue Share</th>
                  <th className="px-8 py-4 text-xs font-bold uppercase tracking-widest text-muted">Month Clients</th>
                  <th className="px-8 py-4 text-xs font-bold uppercase tracking-widest text-muted">Month Incentives (5%)</th>
                  <th className="px-8 py-4 text-xs font-bold uppercase tracking-widest text-muted">Total Incentives (YTD)</th>
                  <th className="px-8 py-4"></th>
                </tr>
              </thead>
              <tbody>
                {filteredStaff.map((staffMember) => (
                  <tr 
                    key={staffMember.id} 
                    onClick={() => setSelectedStaff(staffMember)}
                    className="border-b border-border/50 hover:bg-white/5 transition-all cursor-pointer group"
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center font-bold text-accent">
                          {staffMember.name[0]}
                        </div>
                        <span className="font-bold">{staffMember.name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-muted text-sm">{staffMember.role}</td>
                    <td className="px-8 py-6 font-semibold">₹{Math.round(staffMember.monthRevenue).toLocaleString()}</td>
                    <td className="px-8 py-6 text-sm">{staffMember.monthClients}</td>
                    <td className="px-8 py-6 font-bold text-accent">₹{Math.round(staffMember.monthIncentives).toLocaleString()}</td>
                    <td className="px-8 py-6 text-muted text-sm">₹{Math.round(staffMember.incentives).toLocaleString()}</td>
                    <td className="px-8 py-6 text-right">
                      <ChevronRight size={20} className="text-muted group-hover:text-white transition-all" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-muted">No staff members found. Add your team to start tracking incentives.</div>
          )}
        </div>
      </div>

      {/* Add Staff Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-lg glass rounded-[2rem] p-6 md:p-8 space-y-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold">Add Staff Member</h3>
                <button onClick={() => setIsAddModalOpen(false)} className="text-muted hover:text-white">
                  <X size={24} />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted mb-2 block">Full Name</label>
                  <input 
                    type="text" 
                    value={newStaff.name}
                    onChange={(e) => setNewStaff({...newStaff, name: e.target.value})}
                    className="w-full bg-surface border border-border rounded-xl py-3 px-4 focus:outline-none focus:border-accent/50"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-muted mb-2 block">Phone Number</label>
                  <input 
                    type="text" 
                    value={newStaff.phone}
                    onChange={(e) => setNewStaff({...newStaff, phone: e.target.value})}
                    className="w-full bg-surface border border-border rounded-xl py-3 px-4 focus:outline-none focus:border-accent/50"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-muted mb-2 block">Role</label>
                  <input 
                    type="text" 
                    value={newStaff.role}
                    onChange={(e) => setNewStaff({...newStaff, role: e.target.value})}
                    placeholder="e.g. Senior Stylist"
                    className="w-full bg-surface border border-border rounded-xl py-3 px-4 focus:outline-none focus:border-accent/50"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-muted mb-2 block">Email</label>
                  <input 
                    type="email" 
                    value={newStaff.email}
                    onChange={(e) => setNewStaff({...newStaff, email: e.target.value})}
                    className="w-full bg-surface border border-border rounded-xl py-3 px-4 focus:outline-none focus:border-accent/50"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-muted mb-2 block">Instagram ID</label>
                  <input 
                    type="text" 
                    value={newStaff.instagram}
                    onChange={(e) => setNewStaff({...newStaff, instagram: e.target.value})}
                    placeholder="@username"
                    className="w-full bg-surface border border-border rounded-xl py-3 px-4 focus:outline-none focus:border-accent/50"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => {
                    if (!newStaff.name || !newStaff.role) {
                      alert('Please enter Name and Role');
                      return;
                    }
                    const formatPhoneNumber = (ph: string) => {
                      const trimmed = ph.trim();
                      if (!trimmed) return '+91';
                      const digits = trimmed.replace(/[\s-()]/g, '');
                      if (/^\d{10}$/.test(digits)) return `+91${digits}`;
                      if (/^91\d{10}$/.test(digits)) return `+${digits}`;
                      if (/^\d+$/.test(digits)) return `+91${digits}`;
                      return trimmed;
                    };
                    const formattedPhone = formatPhoneNumber(newStaff.phone);
                    const newMember = {
                      id: `ST-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
                      name: newStaff.name,
                      role: newStaff.role,
                      phone: formattedPhone || 'N/A',
                      email: newStaff.email || 'N/A',
                      instagram: newStaff.instagram || 'N/A',
                    };
                    setStaff(prev => [...prev, newMember]);
                    alert('Staff member added successfully!');
                    setIsAddModalOpen(false);
                    setNewStaff({ name: '', phone: '+91', role: '', email: '', instagram: '' });
                  }}
                  className="flex-1 bg-accent text-white py-4 rounded-2xl font-bold text-lg hover:opacity-90 transition-all"
                >
                  Save Staff Member
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Staff Details Modal */}
      <AnimatePresence>
        {selectedStaff && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedStaff(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-2xl glass rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 space-y-6 md:space-y-8 max-h-[95vh] overflow-y-auto custom-scrollbar"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-accent flex items-center justify-center text-white text-3xl md:text-4xl font-bold shrink-0">
                    {selectedStaff.name[0]}
                  </div>
                  <div>
                    <h3 className="text-2xl md:text-3xl font-bold">{selectedStaff.name}</h3>
                    <p className="text-accent font-bold">{selectedStaff.role}</p>
                    <div className="flex justify-center sm:justify-start gap-4 mt-3">
                      {selectedStaff.phone && <a href={`tel:${selectedStaff.phone}`} className="p-2 bg-surface rounded-xl text-muted hover:text-white transition-all"><Phone size={18} /></a>}
                      {selectedStaff.email && <a href={`mailto:${selectedStaff.email}`} className="p-2 bg-surface rounded-xl text-muted hover:text-white transition-all"><Mail size={18} /></a>}
                      {selectedStaff.instagram && <a href={`https://instagram.com/${selectedStaff.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="p-2 bg-surface rounded-xl text-muted hover:text-white transition-all"><Instagram size={18} /></a>}
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelectedStaff(null)} className="text-muted hover:text-white self-end sm:self-auto p-1">
                  <X size={24} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-surface p-4 rounded-2xl border border-border">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-1">Month Revenue Share</p>
                  <p className="text-xl font-bold text-accent">₹{Math.round(selectedStaff.monthRevenue).toLocaleString()}</p>
                </div>
                <div className="bg-surface p-4 rounded-2xl border border-border">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-1">Month Incentives (5%)</p>
                  <p className="text-xl font-bold text-accent">₹{Math.round(selectedStaff.monthIncentives).toLocaleString()}</p>
                </div>
                <div className="bg-surface p-4 rounded-2xl border border-border">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-1">Month Clients Served</p>
                  <p className="text-xl font-bold">{selectedStaff.monthClients}</p>
                </div>
              </div>

              <div className="bg-surface p-6 rounded-2xl border border-border space-y-4">
                <h4 className="font-bold flex items-center gap-2 border-b border-border pb-3">
                  <Repeat size={18} className="text-accent" />
                  Monthly Incentives Log ({formatMonthName(selectedMonth)})
                </h4>
                <div className="space-y-3 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                  {transactions
                    .filter(tx => getYearMonth(tx.date) === selectedMonth && tx.staffIds && tx.staffIds.includes(selectedStaff.id))
                    .map((tx, idx) => {
                      const incentiveForThisStaff = tx.staffIncentives && tx.staffIncentives[selectedStaff.id] !== undefined
                        ? tx.staffIncentives[selectedStaff.id]
                        : tx.incentivePerStaff;
                      return (
                        <div key={idx} className="flex justify-between items-center p-3 bg-surface-hover rounded-xl border border-border text-sm">
                          <div>
                            <p className="font-bold text-white">{tx.clientName}</p>
                            <p className="text-xs text-muted">{tx.services}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-accent">+₹{Math.round(incentiveForThisStaff)}</p>
                            <p className="text-[10px] text-muted">{tx.date}</p>
                          </div>
                        </div>
                      );
                    })}
                  {transactions.filter(tx => getYearMonth(tx.date) === selectedMonth && tx.staffIds && tx.staffIds.includes(selectedStaff.id)).length === 0 && (
                    <p className="text-sm text-muted text-center italic py-4">No incentive logs found for this month.</p>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
