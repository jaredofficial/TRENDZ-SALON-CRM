import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Calendar as CalendarIcon, 
  Star, 
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Sparkles,
  Download,
  X,
  FileText
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
  Legend
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { Appointment } from '../types';

interface DashboardProps {
  onNavigate: (tab: any) => void;
  userName?: string;
  appointments: Appointment[];
  transactions: any[];
  clients: any[];
  staff: any[];
  settings?: any;
}

export default function Dashboard({ onNavigate, userName, appointments = [], transactions = [], clients = [], staff = [], settings }: DashboardProps) {
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiReportText, setAIReportText] = useState('');

  useEffect(() => {
    async function checkConnection() {
      try {
        const { error } = await supabase.from('appointments').select('count', { count: 'exact', head: true });
        if (error && error.code !== 'PGRST116') {
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

  // Format Helper for Currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  // Get date strings for comparisons (in local timezone to prevent UTC day shifts)
  const getTodayStr = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };
  const getCurrentMonthStr = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${yyyy}-${mm}`;
  };
  const getCurrentYearStr = () => new Date().getFullYear().toString();

  // Dynamic Revenue Calculations
  const todayStr = getTodayStr();
  const currentMonthStr = getCurrentMonthStr();
  const currentYearStr = getCurrentYearStr();

  const dailyRevenue = transactions
    .filter(tx => tx.date === todayStr)
    .reduce((sum, tx) => sum + tx.total, 0);

  const weeklyRevenue = transactions
    .filter(tx => {
      const txDate = new Date(tx.date);
      const diffTime = Math.abs(new Date().getTime() - txDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7;
    })
    .reduce((sum, tx) => sum + tx.total, 0);

  const monthlyRevenue = transactions
    .filter(tx => tx.date.substring(0, 7) === currentMonthStr)
    .reduce((sum, tx) => sum + tx.total, 0);

  const yearlyRevenue = transactions
    .filter(tx => tx.date.substring(0, 4) === currentYearStr)
    .reduce((sum, tx) => sum + tx.total, 0);

  // Generate 7-day revenue overview graph data
  const getGraphData = () => {
    const days = [];
    const dateNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = dateNames[d.getDay()];
      const dayRevenue = transactions
        .filter(tx => tx.date === dateStr)
        .reduce((sum, tx) => sum + tx.total, 0);
      days.push({ name: dayName, revenue: dayRevenue });
    }
    return days;
  };
  const revenueGraphData = getGraphData();

  // Generate dynamic top services
  const getTopServices = () => {
    const counts: Record<string, number> = {};
    transactions.forEach(tx => {
      if (tx.services) {
        tx.services.split(', ').forEach((s: string) => {
          counts[s] = (counts[s] || 0) + 1;
        });
      }
    });
    const colors = ['#dc2626', '#a855f7', '#ec4899', '#3b82f6'];
    const serviceList = Object.keys(counts).map((name, idx) => ({
      name,
      count: counts[name],
      color: colors[idx % colors.length]
    }));
    return serviceList.sort((a, b) => b.count - a.count).slice(0, 4);
  };
  const topServices = getTopServices();

  // Dynamic Client Analytics
  const totalRevenue = transactions.reduce((sum, tx) => sum + tx.total, 0);
  const totalTxs = transactions.length;
  const atv = totalTxs > 0 ? Math.round(totalRevenue / totalTxs) : 0;
  
  const repeatClients = clients.filter(c => (c.visits || 0) > 1).length;
  const retentionRate = clients.length > 0 ? Math.round((repeatClients / clients.length) * 100) : 0;
  
  const activePhones = Array.from(new Set(transactions.map(tx => tx.phone).filter(p => p !== 'N/A')));
  const avgSpend = activePhones.length > 0 ? Math.round(totalRevenue / activePhones.length) : 0;

  // Monthly Goal
  const monthlyGoal = Number(settings?.revenueGoal) || 500000;
  const goalPercentage = Math.min(100, Math.round((monthlyRevenue / monthlyGoal) * 100));

  // CSV Export Utility
  const downloadCSV = (filteredTxs: any[], fileName: string) => {
    const headers = ['Date', 'Transaction ID', 'Customer Name', 'Phone', 'Services Taken', 'Billed Amount (INR)', 'Contributing Staff', 'Incentives Paid (INR)', 'Payment Method'];
    const rows = filteredTxs.map(tx => [
      tx.date,
      tx.id,
      `"${tx.clientName.replace(/"/g, '""')}"`,
      tx.phone,
      `"${tx.services.replace(/"/g, '""')}"`,
      tx.total,
      `"${tx.staffNames.replace(/"/g, '""')}"`,
      Math.round(
        tx.staffIncentives 
          ? Object.values(tx.staffIncentives as Record<string, number>).reduce((sum: number, val: number) => sum + (val || 0), 0)
          : (tx.incentivePerStaff || 0) * (tx.staffIds?.length || 1)
      ),
      tx.paymentMethod
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${fileName}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportLastMonth = () => {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const targetMonthStr = lastMonth.toISOString().substring(0, 7); // YYYY-MM
    const filtered = transactions.filter(tx => tx.date.substring(0, 7) === targetMonthStr);
    
    if (filtered.length === 0) {
      alert("No billing details found for last month.");
      return;
    }
    downloadCSV(filtered, `Trendz_Billing_LastMonth_${targetMonthStr}`);
  };

  const exportYTD = () => {
    const currentYear = new Date().getFullYear().toString();
    const filtered = transactions.filter(tx => tx.date.substring(0, 4) === currentYear);
    
    if (filtered.length === 0) {
      alert("No billing details found for this year yet.");
      return;
    }
    downloadCSV(filtered, `Trendz_Billing_YTD_${currentYear}`);
  };

  const generateAIReport = async () => {
    setIsAIModalOpen(true);
    setIsLoadingAI(true);
    setAIReportText('');

    try {
      const response = await fetch('/api/ai/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactions,
          clients,
          staff,
          stats: {
            daily: dailyRevenue,
            weekly: weeklyRevenue,
            monthly: monthlyRevenue,
            yearly: yearlyRevenue,
            retention: retentionRate,
            atv: atv
          }
        })
      });

      if (!response.ok) {
        let errMsg = `Server error (Status ${response.status})`;
        try {
          const errData = await response.json();
          errMsg = errData.error || errMsg;
        } catch (_) {}
        throw new Error(errMsg);
      }

      const data = await response.json();
      if (data.success) {
        setAIReportText(data.report);
      } else {
        setAIReportText("### Error\nFailed to generate AI report: " + data.error);
      }
    } catch (e: any) {
      setAIReportText("### Error\nFailed to connect to the backend server: " + e.message);
    } finally {
      setIsLoadingAI(false);
    }
  };

  const downloadAIReportAsDoc = () => {
    if (!aiReportText) return;

    const convertMarkdownToHTML = (markdown: string) => {
      return markdown
        .split('\n')
        .map(line => {
          const trimmed = line.trim();
          if (trimmed.startsWith('# ')) {
            return `<h1 style="color: #dc2626; font-family: 'Segoe UI', Arial, sans-serif; margin-top: 24pt; margin-bottom: 12pt; font-size: 20pt; border-bottom: 1px solid #e4e4e7; padding-bottom: 6pt;">${trimmed.replace('# ', '')}</h1>`;
          }
          if (trimmed.startsWith('## ')) {
            return `<h2 style="color: #18181b; font-family: 'Segoe UI', Arial, sans-serif; margin-top: 18pt; margin-bottom: 9pt; font-size: 16pt;">${trimmed.replace('## ', '')}</h2>`;
          }
          if (trimmed.startsWith('### ')) {
            return `<h3 style="color: #3f3f46; font-family: 'Segoe UI', Arial, sans-serif; margin-top: 14pt; margin-bottom: 6pt; font-size: 13pt;">${trimmed.replace('### ', '')}</h3>`;
          }
          if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            return `<li style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 10.5pt; margin-bottom: 4pt; color: #3f3f46; line-height: 1.5;">${trimmed.replace(/^[-*]\s+/, '')}</li>`;
          }
          if (trimmed.startsWith('> [!NOTE]') || trimmed.startsWith('> [!IMPORTANT]') || trimmed.startsWith('> [!WARNING]')) {
            return '';
          }
          if (trimmed.startsWith('> ')) {
            return `<blockquote style="border-left: 3px solid #dc2626; padding-left: 12pt; margin: 12pt 0; font-style: italic; color: #71717a; font-family: 'Segoe UI', Arial, sans-serif; font-size: 10.5pt;">${trimmed.replace('> ', '')}</blockquote>`;
          }
          if (!trimmed) {
            return '<p>&nbsp;</p>';
          }

          const boldFormatted = trimmed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
          return `<p style="font-family: 'Segoe UI', Arial, sans-serif; font-size: 10.5pt; line-height: 1.5; color: #18181b; margin-bottom: 8pt;">${boldFormatted}</p>`;
        })
        .join('\n');
    };

    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <title>Trendz Salon Performance Report</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          body {
            font-family: 'Segoe UI', Arial, sans-serif;
            margin: 1in;
            color: #18181b;
          }
          h1, h2, h3 {
            font-family: 'Segoe UI', Arial, sans-serif;
            font-weight: bold;
          }
          li {
            margin-left: 20px;
          }
        </style>
      </head>
      <body>
        <div style="text-align: center; margin-bottom: 30pt;">
          <h1 style="color: #dc2626; font-size: 26pt; margin-bottom: 4pt; font-family: 'Segoe UI', Arial, sans-serif;">Trendz Salon & Spa</h1>
          <p style="font-size: 11pt; color: #71717a; font-family: 'Segoe UI', Arial, sans-serif; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Executive Performance Summary Report</p>
          <p style="font-size: 9.5pt; color: #a1a1aa; font-family: 'Segoe UI', Arial, sans-serif;">Generated on ${new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <hr style="border: 0; border-top: 1px solid #e4e4e7; margin-bottom: 24pt;" />
        ${convertMarkdownToHTML(aiReportText)}
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff' + htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Trendz_Salon_AI_Performance_Report_${new Date().toISOString().split('T')[0]}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Render simple markdown tags inside AI report modal
  const renderMarkdown = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (line.trim().startsWith('### ')) {
        return <h4 key={i} className="text-base font-bold text-white mt-4 mb-2">{line.replace('### ', '')}</h4>;
      }
      if (line.trim().startsWith('## ')) {
        return <h3 key={i} className="text-lg font-bold text-accent mt-6 mb-3">{line.replace('## ', '')}</h3>;
      }
      if (line.trim().startsWith('# ')) {
        return <h2 key={i} className="text-xl font-bold text-white mt-8 mb-4 border-b border-border pb-2">{line.replace('# ', '')}</h2>;
      }
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        const cleaned = line.replace(/^[-*]\s+/, '');
        return <li key={i} className="ml-4 list-disc text-sm text-muted my-1">{cleaned}</li>;
      }
      if (line.trim().startsWith('> [!NOTE]')) {
        return null;
      }
      if (line.trim().startsWith('> ')) {
        return (
          <blockquote key={i} className="border-l-4 border-accent pl-4 italic text-sm text-muted my-3 bg-surface/50 p-3 rounded-r-xl">
            {line.replace('> ', '')}
          </blockquote>
        );
      }
      
      const parts = line.split(/\*\*(.*?)\*\*/g);
      if (parts.length > 1) {
        return (
          <p key={i} className="text-sm text-muted my-2 leading-relaxed">
            {parts.map((part, idx) => idx % 2 === 1 ? <strong key={idx} className="text-white font-semibold">{part}</strong> : part)}
          </p>
        );
      }
      return <p key={i} className="text-sm text-muted my-2 leading-relaxed">{line}</p>;
    });
  };

  return (
    <div className="space-y-8">
      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Hello, {userName || 'Wasif'}!</h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-muted">Welcome back to your dashboard</p>
            <div className="h-1 w-1 rounded-full bg-muted mx-1"></div>
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-accent animate-pulse' : 
                connectionStatus === 'error' ? 'bg-red-500' : 'bg-yellow-500 animate-pulse'
              }`}></div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted">
                {connectionStatus === 'connected' ? 'Supabase Connected' : 
                 connectionStatus === 'error' ? 'Supabase Error' : 'Checking Connection...'}
              </span>
            </div>
          </div>
        </div>

        {/* Buttons for Exports and AI Report */}
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={exportLastMonth}
            className="bg-surface border border-border hover:border-accent/30 text-muted hover:text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all"
            title="Download CSV report of last month"
          >
            <Download size={14} />
            <span>Last Month CSV</span>
          </button>
          
          <button 
            onClick={exportYTD}
            className="bg-surface border border-border hover:border-accent/30 text-muted hover:text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all"
            title="Download CSV report of Year to Date"
          >
            <Download size={14} />
            <span>YTD CSV</span>
          </button>

          <button 
            onClick={generateAIReport}
            className="bg-accent text-white px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all hover:opacity-90 shadow-lg shadow-accent/20 border border-accent/10"
          >
            <Sparkles size={14} />
            <span>AI Report Summary</span>
          </button>
        </div>
      </div>

      {/* Dynamic Revenue Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Daily Revenue" 
          value={formatCurrency(dailyRevenue)} 
          change="+12.5%" 
          isPositive={true} 
          icon={DollarSign}
        />
        <StatCard 
          title="Weekly Revenue" 
          value={formatCurrency(weeklyRevenue)} 
          change="+8.2%" 
          isPositive={true} 
          icon={TrendingUp}
        />
        <StatCard 
          title="Monthly Revenue" 
          value={formatCurrency(monthlyRevenue)} 
          change="+15.4%" 
          isPositive={true} 
          icon={CalendarIcon}
        />
        <StatCard 
          title="Yearly Revenue" 
          value={formatCurrency(yearlyRevenue)} 
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
            {transactions.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueGraphData}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#71717a" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis 
                    stroke="#71717a" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(value) => `₹${value}`}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px' }}
                    itemStyle={{ color: '#dc2626' }}
                    formatter={(value) => [`₹${value}`, 'Revenue']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#dc2626" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorRev)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted italic text-sm">
                No checkout logs available. Sales chart will populate dynamically.
              </div>
            )}
          </div>
        </div>

        {/* Monthly Goal Progress */}
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
                  strokeDashoffset={502.4 * (1 - goalPercentage / 100)}
                  className="text-accent"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold">{goalPercentage}%</span>
                <span className="text-xs text-muted uppercase tracking-widest">Completed</span>
              </div>
            </div>
            <div className="mt-8 text-center">
              <p className="text-2xl font-bold">{formatCurrency(monthlyRevenue)} / {formatCurrency(monthlyGoal)}</p>
              <p className="text-sm text-muted mt-1">Monthly target to reach goal</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Services */}
        <div className="glass rounded-3xl p-6">
          <h3 className="text-xl font-bold mb-6">Most Used Services</h3>
          <div className="space-y-6">
            {topServices.length > 0 ? (
              topServices.map((service: any, index: number) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between mb-2">
                      <span className="font-semibold">{service.name}</span>
                      <span className="text-muted">{service.count} bookings</span>
                    </div>
                    <div className="h-2 bg-border rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(service.count / Math.max(...topServices.map((t: any) => t.count))) * 100}%` }}
                        transition={{ duration: 1, delay: index * 0.1 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: service.color }}
                      />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted italic">Checkout transactions to track service demand statistics.</p>
            )}
          </div>
        </div>

        {/* Client Analytics Section */}
        <div className="glass rounded-3xl p-6">
          <h3 className="text-xl font-bold mb-6">Client Analytics</h3>
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-surface p-4 rounded-2xl border border-border">
              <p className="text-[10px] text-muted uppercase font-bold tracking-widest mb-1">Retention Rate</p>
              <p className="text-2xl font-bold text-accent">{retentionRate}%</p>
            </div>
            <div className="bg-surface p-4 rounded-2xl border border-border">
              <p className="text-[10px] text-muted uppercase font-bold tracking-widest mb-1">Avg Ticket Value</p>
              <p className="text-2xl font-bold text-accent">₹{atv.toLocaleString()}</p>
            </div>
            <div className="bg-surface p-4 rounded-2xl border border-border">
              <p className="text-[10px] text-muted uppercase font-bold tracking-widest mb-1">Repeat Clients</p>
              <p className="text-2xl font-bold text-accent">{repeatClients}</p>
            </div>
            <div className="bg-surface p-4 rounded-2xl border border-border">
              <p className="text-[10px] text-muted uppercase font-bold tracking-widest mb-1">Avg Client Spend</p>
              <p className="text-2xl font-bold text-accent">₹{avgSpend.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Appointments Preview */}
        <div className="glass rounded-3xl p-6 col-span-2">
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

      {/* AI Report Modal */}
      <AnimatePresence>
        {isAIModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAIModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-2xl bg-surface border border-border rounded-[2rem] md:rounded-[2.5rem] p-5 md:p-8 shadow-2xl z-10 max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
                <div className="flex items-center gap-2 text-accent">
                  <Sparkles size={20} />
                  <h3 className="text-lg md:text-xl font-bold">Gemini Executive AI Summary</h3>
                </div>
                <button onClick={() => setIsAIModalOpen(false)} className="text-muted hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 py-2">
                {isLoadingAI ? (
                  <div className="h-48 flex flex-col items-center justify-center space-y-4 text-center">
                    <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
                    <div>
                      <p className="font-semibold text-white">Analyzing Salon Performance...</p>
                      <p className="text-xs text-muted mt-1">Connecting to Gemini AI Engine</p>
                    </div>
                  </div>
                ) : (
                  <div className="prose prose-invert max-w-none">
                    {renderMarkdown(aiReportText)}
                  </div>
                )}
              </div>

              <div className="border-t border-border pt-4 mt-4 flex flex-col sm:flex-row justify-end gap-3">
                <button 
                  onClick={() => setIsAIModalOpen(false)}
                  className="bg-surface border border-border hover:border-accent/30 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all order-last sm:order-none"
                >
                  Close
                </button>
                {!isLoadingAI && (
                  <>
                    <button 
                      onClick={downloadAIReportAsDoc}
                      className="bg-surface border border-border hover:border-accent/30 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                    >
                      <FileText size={14} className="text-accent" />
                      <span>Download Word Doc</span>
                    </button>
                    <button 
                      onClick={() => window.print()}
                      className="bg-accent text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all hover:opacity-90"
                    >
                      Print Report
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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
