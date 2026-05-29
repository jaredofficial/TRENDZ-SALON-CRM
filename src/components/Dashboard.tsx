import React from 'react';
import { 
  TrendingUp, 
  Calendar as CalendarIcon, 
  Star, 
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  FileText,
  Sparkles
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { motion } from 'motion/react';

const branchData: Record<string, any> = {
  'chandni': {
    revenue: [
      { name: 'Mon', revenue: 45000 },
      { name: 'Tue', revenue: 32000 },
      { name: 'Wed', revenue: 25000 },
      { name: 'Thu', revenue: 30000 },
      { name: 'Fri', revenue: 22000 },
      { name: 'Sat', revenue: 28000 },
      { name: 'Sun', revenue: 38000 },
    ],
    services: [
      { name: 'Haircut', count: 160, color: '#d4ff33' },
      { name: 'Coloring', count: 95, color: '#8b5cf6' },
      { name: 'Facial', count: 70, color: '#ec4899' },
      { name: 'Manicure', count: 55, color: '#3b82f6' },
    ],
    analytics: {
      newClients: 45,
      repeatClients: 155,
      retentionRate: 78,
      atv: 1850,
      avgSpend: 2450,
      acquisitionTrend: [
        { month: 'Jan', new: 30, repeat: 120 },
        { month: 'Feb', new: 35, repeat: 130 },
        { month: 'Mar', new: 45, repeat: 155 },
      ],
      retentionTrend: [
        { month: 'Jan', rate: 72 },
        { month: 'Feb', rate: 75 },
        { month: 'Mar', rate: 78 },
      ]
    },
    stats: {
      daily: '₹14,200',
      weekly: '₹92,400',
      monthly: '₹3,85,000',
      yearly: '₹45,20,000'
    }
  },
  'new-market': {
    revenue: [
      { name: 'Mon', revenue: 35000 },
      { name: 'Tue', revenue: 28000 },
      { name: 'Wed', revenue: 18000 },
      { name: 'Thu', revenue: 24000 },
      { name: 'Fri', revenue: 15000 },
      { name: 'Sat', revenue: 20000 },
      { name: 'Sun', revenue: 30000 },
    ],
    services: [
      { name: 'Haircut', count: 120, color: '#d4ff33' },
      { name: 'Coloring', count: 65, color: '#8b5cf6' },
      { name: 'Facial', count: 50, color: '#ec4899' },
      { name: 'Manicure', count: 35, color: '#3b82f6' },
    ],
    analytics: {
      newClients: 32,
      repeatClients: 118,
      retentionRate: 74,
      atv: 1650,
      avgSpend: 2150,
      acquisitionTrend: [
        { month: 'Jan', new: 25, repeat: 100 },
        { month: 'Feb', new: 28, repeat: 110 },
        { month: 'Mar', new: 32, repeat: 118 },
      ],
      retentionTrend: [
        { month: 'Jan', rate: 70 },
        { month: 'Feb', rate: 72 },
        { month: 'Mar', rate: 74 },
      ]
    },
    stats: {
      daily: '₹10,800',
      weekly: '₹75,200',
      monthly: '₹2,95,000',
      yearly: '₹38,50,000'
    }
  }
};

import { supabase } from '../lib/supabase';
import { Appointment } from '../types';

export default function Dashboard({ onNavigate, branchId, userRole, userName, appointments = [] }: { onNavigate: (tab: any) => void, branchId: string, userRole?: string, userName?: string, appointments?: Appointment[] }) {
  const [connectionStatus, setConnectionStatus] = React.useState<'checking' | 'connected' | 'error'>('checking');

  // Filter data based on branch
  const currentBranchData = branchData[branchId] || branchData['chandni'];
  const filteredData = currentBranchData.revenue;
  const filteredServices = currentBranchData.services;
  const analytics = currentBranchData.analytics;
  const stats = currentBranchData.stats;

  React.useEffect(() => {
    async function checkConnection() {
      try {
        const { data, error } = await supabase.from('services').select('count', { count: 'exact', head: true });
        if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows", which is fine
          setConnectionStatus('error');
        } else {
          setConnectionStatus('connected');
        }
      } catch (e) {
        setConnectionStatus('error');
      }
    }
    checkConnection();
  }, []);

  const generateAIReport = () => {
    alert('Generating AI Summary Report... This will be available for download as a PDF shortly.');
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Hello, {userName || 'Alex'}!</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-muted">Ready for today's challenges?</p>
            <div className="h-1 w-1 rounded-full bg-muted mx-1"></div>
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-accent' : 
                connectionStatus === 'error' ? 'bg-red-500' : 'bg-yellow-500 animate-pulse'
              }`}></div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted">
                {connectionStatus === 'connected' ? 'Supabase Connected' : 
                 connectionStatus === 'error' ? 'Supabase Error' : 'Checking Connection...'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={generateAIReport}
            className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 transition-all border border-white/10"
          >
            <Sparkles size={18} className="text-accent" />
            AI Report Summary
          </button>
          <select className="bg-surface border border-border rounded-lg px-4 py-2 text-sm focus:outline-none">
            <option>Today</option>
            <option>This Week</option>
            <option>This Month</option>
          </select>
        </div>
      </div>

      {/* Stats Grid - Revenue Focus */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Daily Revenue" 
          value={stats.daily} 
          change="+12.5%" 
          isPositive={true} 
          icon={DollarSign}
        />
        <StatCard 
          title="Weekly Revenue" 
          value={stats.weekly} 
          change="+8.2%" 
          isPositive={true} 
          icon={TrendingUp}
        />
        <StatCard 
          title="Monthly Revenue" 
          value={stats.monthly} 
          change="+15.4%" 
          isPositive={true} 
          icon={CalendarIcon}
        />
        <StatCard 
          title="Yearly Revenue" 
          value={stats.yearly} 
          change="+22.1%" 
          isPositive={true} 
          icon={Star}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 glass rounded-3xl p-6">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold">Revenue Overview</h3>
            <div className="flex gap-4 text-xs font-semibold">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-accent"></span>
                <span>Revenue (₹)</span>
              </div>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={filteredData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d4ff33" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#d4ff33" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#888888" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="#888888" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(value) => `₹${value}`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#141414', border: '1px solid #262626', borderRadius: '12px' }}
                  itemStyle={{ color: '#d4ff33' }}
                  formatter={(value) => [`₹${value}`, 'Revenue']}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#d4ff33" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorRev)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Goal */}
        <div className="glass rounded-3xl p-6 flex flex-col justify-between">
          <h3 className="text-xl font-bold mb-4">Monthly Goal</h3>
          <div className="flex flex-col items-center justify-center flex-1">
            <div className="relative w-48 h-48">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="96"
                  cy="96"
                  r="80"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="transparent"
                  className="text-border"
                />
                <circle
                  cx="96"
                  cy="96"
                  r="80"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="transparent"
                  strokeDasharray={502.4}
                  strokeDashoffset={502.4 * (1 - 0.68)}
                  className="text-accent"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold">68%</span>
                <span className="text-xs text-muted uppercase tracking-widest">Completed</span>
              </div>
            </div>
            <div className="mt-8 text-center">
              <p className="text-2xl font-bold">{stats.monthly} / ₹5,00,000</p>
              <p className="text-sm text-muted mt-1">On track for your goal!</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Services */}
        <div className="glass rounded-3xl p-6">
          <h3 className="text-xl font-bold mb-6">Most Used Services</h3>
          <div className="space-y-6">
            {filteredServices.map((service: any, index: number) => (
              <div key={index} className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex justify-between mb-2">
                    <span className="font-semibold">{service.name}</span>
                    <span className="text-muted">{service.count} bookings</span>
                  </div>
                  <div className="h-2 bg-border rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(service.count / 200) * 100}%` }}
                      transition={{ duration: 1, delay: index * 0.1 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: service.color }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Client Analytics Section */}
        <div className="glass rounded-3xl p-6">
          <h3 className="text-xl font-bold mb-6">Client Analytics</h3>
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-surface p-4 rounded-2xl border border-border">
              <p className="text-[10px] text-muted uppercase font-bold tracking-widest mb-1">Retention Rate</p>
              <p className="text-2xl font-bold text-accent">{analytics.retentionRate}%</p>
            </div>
            <div className="bg-surface p-4 rounded-2xl border border-border">
              <p className="text-[10px] text-muted uppercase font-bold tracking-widest mb-1">Avg Ticket Value</p>
              <p className="text-2xl font-bold text-accent">₹{analytics.atv.toLocaleString()}</p>
            </div>
            <div className="bg-surface p-4 rounded-2xl border border-border">
              <p className="text-[10px] text-muted uppercase font-bold tracking-widest mb-1">Repeat Clients</p>
              <p className="text-2xl font-bold text-accent">{Math.round((analytics.repeatClients / (analytics.repeatClients + analytics.newClients)) * 100)}%</p>
            </div>
            <div className="bg-surface p-4 rounded-2xl border border-border">
              <p className="text-[10px] text-muted uppercase font-bold tracking-widest mb-1">Avg Client Spend</p>
              <p className="text-2xl font-bold text-accent">₹{analytics.avgSpend.toLocaleString()}</p>
            </div>
          </div>
          
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.acquisitionTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                <XAxis dataKey="month" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#141414', border: '1px solid #262626', borderRadius: '12px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                <Bar dataKey="new" name="New Clients" fill="#d4ff33" radius={[4, 4, 0, 0]} />
                <Bar dataKey="repeat" name="Repeat Clients" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Retention Trend */}
        <div className="glass rounded-3xl p-6">
          <h3 className="text-xl font-bold mb-6">Retention Trend</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.retentionTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
                <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#141414', border: '1px solid #262626', borderRadius: '12px' }}
                  formatter={(v) => [`${v}%`, 'Retention Rate']}
                />
                <Line type="monotone" dataKey="rate" stroke="#d4ff33" strokeWidth={3} dot={{ r: 4, fill: '#d4ff33' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Planned Activities / Calendar Preview */}
        <div className="glass rounded-3xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold">Today's Appointments</h3>
            <button 
              onClick={() => onNavigate('appointments')}
              className="text-xs text-accent font-semibold uppercase tracking-widest hover:underline"
            >
              View All
            </button>
          </div>
          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
            {(() => {
              const todayStr = new Date().toISOString().split('T')[0];
              const todayAppts = appointments.filter(appt => appt.date === todayStr && appt.status !== 'cancelled');
              
              return todayAppts.length > 0 ? (
                todayAppts.map((appt) => (
                  <div key={appt.id} onClick={() => onNavigate('appointments')} className="flex items-center gap-4 p-4 rounded-2xl bg-surface-hover border border-border group hover:border-accent/30 transition-all cursor-pointer">
                    <div className="w-12 h-12 rounded-xl bg-surface flex flex-col items-center justify-center text-accent font-bold">
                      <Clock size={16} />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold">{appt.clientName}</p>
                      <p className="text-xs text-muted">{appt.service}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{appt.time}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-muted">
                  <p className="text-sm font-semibold text-white">No Appointments</p>
                  <p className="text-xs mt-1">No bookings scheduled for today.</p>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, change, isPositive, icon: Icon }: any) {
  return (
    <div className="glass rounded-3xl p-6 card-hover">
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 bg-surface rounded-2xl text-accent">
          <Icon size={20} />
        </div>
        <div className={`flex items-center gap-1 text-xs font-bold ${isPositive ? 'text-accent' : 'text-red-500'}`}>
          {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {change}
        </div>
      </div>
      <p className="text-muted text-sm font-medium">{title}</p>
      <h4 className="text-2xl font-bold mt-1">{value}</h4>
    </div>
  );
}
