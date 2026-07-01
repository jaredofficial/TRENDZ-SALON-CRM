import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  CreditCard, 
  Users, 
  UserCircle, 
  Settings as SettingsIcon, 
  LogOut,
  Bell,
  Search,
  ChevronLeft,
  Menu,
  Scissors,
  User as UserIcon,
  Sun,
  Moon,
  Calendar,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { customers as initialCustomers, services, staffMembers as initialStaff, transactions as initialTransactions } from './data/mockData';
import { User as UserType, branches, Appointment } from './types';
import Dashboard from './components/Dashboard';
import POS from './components/POS';
import StaffTracking from './components/StaffTracking';
import ClientDatabase from './components/ClientDatabase';
import AutomationSettings from './components/AutomationSettings';
import Settings from './components/Settings';
import Appointments from './components/Appointments';
import logoUrl from './logo.png';
import { supabase } from './lib/supabase';

type Tab = 'dashboard' | 'pos' | 'appointments' | 'staff' | 'clients' | 'automations' | 'settings';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  const [currentUser, setCurrentUser] = useState<UserType | null>({
    username: 'wasif-admin',
    name: 'Wasif',
    role: 'owner'
  });
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchSelectedIndex, setSearchSelectedIndex] = useState(-1);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState(false);

  // Shared application states with localStorage persistence
  const [clients, setClients] = useState<any[]>(() => {
    const saved = localStorage.getItem('trendz_clients');
    return saved ? JSON.parse(saved) : initialCustomers;
  });

  const [staff, setStaff] = useState<any[]>(() => {
    const saved = localStorage.getItem('trendz_staff');
    return saved ? JSON.parse(saved) : initialStaff;
  });

  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const saved = localStorage.getItem('trendz_appointments');
    const parsed = saved ? JSON.parse(saved) : [];
    return parsed.filter((appt: any) => appt.date !== '2026-06-21');
  });

  const [transactions, setTransactions] = useState<any[]>(() => {
    const saved = localStorage.getItem('trendz_transactions');
    if (saved) {
      try {
        const txs = JSON.parse(saved);
        // Self-healing: If cache has transactions but all of them are mapped to ST-TRENDZ (the old bug),
        // clear it so it falls back to the fresh, synchronized Supabase database/mockData list.
        const hasOtherStaff = txs.some((tx: any) => tx.staffIds && tx.staffIds.some((id: string) => id !== 'ST-TRENDZ'));
        if (!hasOtherStaff && txs.length > 50) {
          console.warn("Auto-cleared corrupted ST-TRENDZ-only transaction cache.");
          localStorage.removeItem('trendz_transactions');
          return initialTransactions.filter((tx: any) => tx.date !== '2026-06-21');
        }
        return txs.filter((tx: any) => tx.date !== '2026-06-21');
      } catch (e) {}
    }
    return initialTransactions.filter((tx: any) => tx.date !== '2026-06-21');
  });

  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('trendz_settings');
    return saved ? JSON.parse(saved) : {
      revenueGoal: '500000',
      upiId: 'roy.rahul11101@okhdfcbank',
      salonName: 'Trendz Salon & Spa',
      loyaltyPointsPerRupee: '1',
      defaultMessageCap: '5'
    };
  });

  const [localServices, setLocalServices] = useState<any[]>(() => {
    const saved = localStorage.getItem('trendz_services');
    let loaded = saved ? JSON.parse(saved) : services;
    // Auto-sync if the new packages are missing from cache, or if the cache was wiped/truncated
    const hasHead2Toe = loaded.some((s: any) => s.id === 'pkg-head2toe');
    if (!hasHead2Toe || loaded.length < 30) {
      loaded = services;
      localStorage.setItem('trendz_services', JSON.stringify(services));
    }
    return loaded;
  });

  useEffect(() => {
    localStorage.setItem('trendz_clients', JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem('trendz_staff', JSON.stringify(staff));
  }, [staff]);

  useEffect(() => {
    localStorage.setItem('trendz_appointments', JSON.stringify(appointments));
  }, [appointments]);

  useEffect(() => {
    localStorage.setItem('trendz_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('trendz_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('trendz_services', JSON.stringify(localServices));
  }, [localServices]);

  // Load data from Supabase on startup
  useEffect(() => {
    async function loadDataFromSupabase() {
      const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
      if (!rawUrl || rawUrl.includes('placeholder')) {
        console.log("Supabase URL is placeholder, skipping cloud loading");
        return;
      }

      try {
        console.log("⏳ Syncing App state with remote Supabase database...");
        
        // 1. Fetch staff
        const { data: dbStaff } = await supabase.from('staff').select('*');
        if (dbStaff && dbStaff.length > 0) {
          setStaff(dbStaff.map(s => ({
            id: s.id,
            name: s.name,
            role: s.role,
            phone: s.phone || '+919999999901',
            email: s.email || `${s.name.toLowerCase()}@trendzsalon.com`
          })));
        }

        // 2. Fetch transactions
        const { data: dbTxs } = await supabase.from('transactions').select('*').order('created_at', { ascending: false });
        let transactionsList: any[] = [];
        if (dbTxs && dbTxs.length > 0) {
          let localTxs: any[] = [];
          const savedTxs = localStorage.getItem('trendz_transactions');
          if (savedTxs) {
            try {
              localTxs = JSON.parse(savedTxs);
            } catch (e) {}
          }

          transactionsList = dbTxs.map(tx => {
            const matchedTx = localTxs.find(ltx => ltx.id === tx.id) || initialTransactions.find(itx => itx.id === tx.id);
            
            return {
              id: tx.id,
              date: tx.created_at ? tx.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
              timestamp: tx.created_at || new Date().toISOString(),
              clientName: tx.client_name,
              phone: tx.phone,
              services: tx.services,
              total: tx.total,
              paymentMethod: tx.payment_method || 'Cash',
              staffNames: matchedTx ? matchedTx.staffNames : 'Trendz Stylist',
              staffIds: matchedTx ? matchedTx.staffIds : ['ST-TRENDZ'],
              incentivePerStaff: matchedTx ? matchedTx.incentivePerStaff : Math.round(tx.total * 0.05),
              staffIncentives: matchedTx ? matchedTx.staffIncentives : { 'ST-TRENDZ': Math.round(tx.total * 0.05) },
              staffRevenueShare: matchedTx ? matchedTx.staffRevenueShare : { 'ST-TRENDZ': tx.total }
            };
          }).filter((tx: any) => tx.date !== '2026-06-21');
          setTransactions(transactionsList);
        }

        // 3. Fetch clients
        const { data: dbClients } = await supabase.from('clients').select('*');
        if (dbClients && dbClients.length > 0) {
          const enrichedClients = dbClients.map(c => {
            const clientTxs = transactionsList.filter(tx => tx.phone === c.phone);
            const totalSpent = clientTxs.reduce((sum, tx) => sum + (tx.total || 0), 0);
            const visits = clientTxs.length || c.total_visits || 0;
            const lastVisit = clientTxs.length > 0 
              ? clientTxs[0].date 
              : c.last_visit || 'N/A';
            const points = Math.round(totalSpent * 0.1);

            return {
              id: c.id,
              name: c.name,
              phone: c.phone,
              visits,
              totalSpent,
              lastVisit,
              points,
              last30DayReminderCycle: c.last_visit ? c.last_visit : undefined,
              last60DayReminderCycle: c.last_visit ? c.last_visit : undefined
            };
          });
          setClients(enrichedClients);
        }

        // 4. Fetch appointments
        const { data: dbAppts } = await supabase.from('appointments').select('*');
        if (dbAppts && dbAppts.length > 0) {
          setAppointments(dbAppts.map(appt => ({
            id: appt.id,
            clientName: appt.client_name,
            phone: appt.phone,
            service: appt.service,
            date: appt.date,
            time: appt.time,
            status: appt.status || 'confirmed'
          })).filter((appt: any) => appt.date !== '2026-06-21'));
        }
        
        console.log("✅ Successfully loaded live cloud data from Supabase!");
      } catch (err) {
        console.error("Failed loading from Supabase:", err);
      }
    }

    loadDataFromSupabase();
  }, []);

  // Automated 30/60 Days Inactivity Reminders check
  useEffect(() => {
    if (!clients || clients.length === 0) return;

    const checkAndSendReminders = async () => {
      const isMajorTreatment = (servicesStr: string): boolean => {
        const normalized = servicesStr.toLowerCase();
        const majorKeywords = [
          'color', 'colour', 'straight', 'spa', 'keratin', 
          'nanoplastia', 'treatment', 'smoothening', 'global', 
          'root touch', 'touch-up', 'touch up'
        ];
        return majorKeywords.some(keyword => normalized.includes(keyword));
      };

      const updatedClients = [...clients];
      let changed = false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayStr = today.toISOString().split('T')[0];
      const trackerSaved = localStorage.getItem('trendz_daily_automation_tracker');
      let tracker = { date: todayStr, count: 0 };
      if (trackerSaved) {
        try {
          const parsed = JSON.parse(trackerSaved);
          if (parsed.date === todayStr) {
            tracker = parsed;
          }
        } catch (e) {}
      }

      for (let i = 0; i < updatedClients.length; i++) {
        const client = updatedClients[i];
        if (!client.lastVisit || client.lastVisit === 'N/A' || client.lastVisit === 'N/A ') continue;

        const lastVisitDate = new Date(client.lastVisit);
        lastVisitDate.setHours(0, 0, 0, 0);
        const diffTime = today.getTime() - lastVisitDate.getTime();
        if (diffTime < 0) continue;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 30) {
          // Client is active. Mark reminder cycles as 'pending' so that when they hit 30 or 60 days in the future, reminders will fire.
          if (client.last30DayReminderCycle !== 'pending') {
            client.last30DayReminderCycle = 'pending';
            changed = true;
          }
          if (client.last60DayReminderCycle !== 'pending') {
            client.last60DayReminderCycle = 'pending';
            changed = true;
          }
        } else if (diffDays >= 30 && diffDays <= 35) {
          // If the cycle has never been set (historical client already in inactive zone on load),
          // set it to lastVisit to skip sending initial bulk messages.
          if (client.last30DayReminderCycle === undefined) {
            client.last30DayReminderCycle = client.lastVisit;
            changed = true;
          } else if (client.last30DayReminderCycle === 'pending') {
            const clientTxs = transactions.filter(tx => tx.phone === client.phone);
            const lastTx = clientTxs[clientTxs.length - 1];
            const lastService = lastTx ? lastTx.services : "service";

            if (isMajorTreatment(lastService)) {
              // Skip 30-day reminder for major treatments (they trigger at 60 days)
              console.log(`[AUTO REMINDER] Client ${client.name} has major hair treatment (${lastService}). Skipping 30-day reminder.`);
              client.last30DayReminderCycle = client.lastVisit;
              changed = true;
            } else {
              if (tracker.count >= 5) {
                console.log(`[AUTO REMINDER] Daily automation limit reached (5/5). Skipping 30-day trigger for ${client.name} today.`);
              } else {
                console.log(`[AUTO REMINDER] Triggering 30-day reminder for ${client.name}`);
                tracker.count++;
                localStorage.setItem('trendz_daily_automation_tracker', JSON.stringify(tracker));
                try {
                  await fetch('/api/automation/trigger', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      event: 'visit_completed',
                      customer: { name: client.name, phone: client.phone },
                      template_id: 'appointment_follow_up_upsell',
                      variables: ["30", lastService]
                    })
                  });
                  client.last30DayReminderCycle = client.lastVisit; // mark as sent
                  changed = true;
                } catch (err) {
                  console.error('Failed to trigger auto 30-day reminder:', err);
                }
              }
            }
          }

          // Ensure 60-day cycle remains 'pending' if it was not already set, since they are between 30 and 60 days
          if (client.last60DayReminderCycle !== 'pending' && client.last60DayReminderCycle !== client.lastVisit) {
            client.last60DayReminderCycle = 'pending';
            changed = true;
          }
        } else if (diffDays > 35 && diffDays < 60) {
          // Beyond the 30-35 window, mark 30-day cycle as sent/skipped if not already
          if (client.last30DayReminderCycle !== client.lastVisit) {
            client.last30DayReminderCycle = client.lastVisit;
            changed = true;
          }
          // Ensure 60-day cycle remains 'pending'
          if (client.last60DayReminderCycle !== 'pending' && client.last60DayReminderCycle !== client.lastVisit) {
            client.last60DayReminderCycle = 'pending';
            changed = true;
          }
        } else if (diffDays >= 60 && diffDays <= 65) {
          // If the cycle has never been set (historical client already in inactive zone on load),
          // set it to lastVisit to skip sending.
          if (client.last60DayReminderCycle === undefined) {
            client.last30DayReminderCycle = client.lastVisit;
            client.last60DayReminderCycle = client.lastVisit;
            changed = true;
          } else if (client.last60DayReminderCycle === 'pending') {
            const clientTxs = transactions.filter(tx => tx.phone === client.phone);
            const lastTx = clientTxs[clientTxs.length - 1];
            const lastService = lastTx ? lastTx.services : "service";

            if (!isMajorTreatment(lastService)) {
              // Skip 60-day reminder for normal services (they triggered at 30 days)
              console.log(`[AUTO REMINDER] Client ${client.name} last service was normal (${lastService}). Skipping 60-day reminder.`);
              client.last60DayReminderCycle = client.lastVisit;
              changed = true;
            } else {
              if (tracker.count >= 5) {
                console.log(`[AUTO REMINDER] Daily automation limit reached (5/5). Skipping 60-day trigger for ${client.name} today.`);
              } else {
                console.log(`[AUTO REMINDER] Triggering 60-day reminder for ${client.name}`);
                tracker.count++;
                localStorage.setItem('trendz_daily_automation_tracker', JSON.stringify(tracker));
                try {
                  await fetch('/api/automation/trigger', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      event: 'visit_completed',
                      customer: { name: client.name, phone: client.phone },
                      template_id: 'appointment_follow_up_upsell',
                      variables: ["60", lastService]
                    })
                  });
                  client.last60DayReminderCycle = client.lastVisit; // mark as sent
                  changed = true;
                } catch (err) {
                  console.error('Failed to trigger auto 60-day reminder:', err);
                }
              }
            }
          }
        } else if (diffDays > 65) {
          // Beyond the 60-65 window, mark 60-day cycle as sent/skipped if not already
          if (client.last60DayReminderCycle !== client.lastVisit) {
            client.last30DayReminderCycle = client.lastVisit;
            client.last60DayReminderCycle = client.lastVisit;
            changed = true;
          }
        }
      }

      if (changed) {
        setClients(updatedClients);
      }
    };

    const timer = setTimeout(() => {
      checkAndSendReminders();
    }, 5000);

    return () => clearTimeout(timer);
  }, [clients, transactions]);

  useEffect(() => {

    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, [theme]);

  const handleLogin = (user: UserType) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'pos', icon: CreditCard, label: 'POS / Checkout' },
    { id: 'appointments', icon: Calendar, label: 'Appointments' },
    { id: 'staff', icon: Users, label: 'Staff Tracking' },
    { id: 'clients', icon: UserCircle, label: 'Client Base' },
    { id: 'settings', icon: SettingsIcon, label: 'Settings' },
  ];

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredServices = localServices.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredStaff = staff.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const allResults = [
    ...filteredClients.map(c => ({ ...c, type: 'clients' })),
    ...filteredServices.map(s => ({ ...s, type: 'pos' })),
    ...filteredStaff.map(s => ({ ...s, type: 'staff' }))
  ];

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      setSearchSelectedIndex(prev => (prev < allResults.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      setSearchSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter' && searchSelectedIndex >= 0) {
      const selected = allResults[searchSelectedIndex];
      setActiveTab(selected.type as Tab);
      setSearchQuery('');
      setIsSearchFocused(false);
    }
  };

  // Login bypassed, currentUser is preset by default

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <AnimatePresence mode="wait">
        {isLoading && (
          <motion.div
            key="preloader"
            initial={{ opacity: 1 }}
            exit={{ 
              y: '-100%',
              opacity: 0,
              transition: { ease: [0.76, 0, 0.24, 1], duration: 0.8 } 
            }}
            className="fixed inset-0 bg-background z-[9999] flex flex-col items-center justify-center"
          >
            {/* Background Radial Glow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(220,38,38,0.12)_0%,transparent_60%)] pointer-events-none" />

            <div className="relative flex flex-col items-center max-w-xs w-full px-6 text-center space-y-6">
              {/* Logo with breathing effect */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ ease: [0.16, 1, 0.3, 1], duration: 1.2 }}
                className="w-48 h-24 flex items-center justify-center overflow-hidden mb-4"
              >
                <motion.img 
                  src={logoUrl} 
                  alt="Logo" 
                  className="w-full h-full object-contain"
                  animate={{
                    scale: [1, 1.03, 1],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 3,
                    ease: "easeInOut"
                  }}
                />
              </motion.div>

              {/* Tagline */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 0.8, y: 0 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted"
              >
                Elegance in every detail
              </motion.p>

              {/* Progress Bar Container */}
              <div className="w-40 h-[2px] bg-border rounded-full overflow-hidden mt-4 relative">
                <motion.div 
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ ease: "easeInOut", duration: 1.6 }}
                  className="h-full bg-accent rounded-full"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarCollapsed ? 80 : 260 }}
        transition={{ ease: [0.22, 1, 0.36, 1], duration: 0.6 }}
        className="border-r border-border hidden md:flex flex-col py-8 px-4 relative z-50 bg-surface/50 backdrop-blur-md"
      >
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="absolute -right-3 top-10 w-6 h-6 bg-accent rounded-full flex items-center justify-center text-accent-foreground shadow-lg z-50 hover:scale-110 transition-transform"
        >
          {isSidebarCollapsed ? <Menu size={14} /> : <ChevronLeft size={14} />}
        </motion.button>

        <div className={`flex items-center justify-center mb-12 transition-all duration-300 ${isSidebarCollapsed ? 'px-1' : 'px-4'}`}>
          <div className={`flex-shrink-0 flex items-center justify-center overflow-hidden transition-all duration-300 ${
            isSidebarCollapsed ? 'w-12 h-12' : 'w-48 h-24'
          }`}>
            <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          {menuItems.map((item) => (
            <motion.button
              whileTap={{ scale: 0.95 }}
              key={item.id}
              onClick={() => setActiveTab(item.id as Tab)}
              className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-200 ${
                activeTab === item.id 
                  ? 'bg-accent text-accent-foreground font-semibold' 
                  : 'text-muted hover:bg-surface hover:text-[color:var(--card-text)]'
              } ${isSidebarCollapsed ? 'justify-center px-0' : ''}`}
              title={isSidebarCollapsed ? item.label : ''}
            >
              <item.icon size={24} className="flex-shrink-0" />
              {!isSidebarCollapsed && <span>{item.label}</span>}
            </motion.button>
          ))}
        </nav>

        <div className="mt-auto pt-8 border-t border-border">
          <div className={`mt-6 flex items-center gap-3 px-2 ${isSidebarCollapsed ? 'justify-center' : ''}`}>
            <div className="w-10 h-10 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-bold flex-shrink-0">
              {currentUser?.name[0]}
            </div>
            {!isSidebarCollapsed && (
              <div className="overflow-hidden">
                <p className="text-sm font-semibold truncate">{currentUser?.name}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-accent truncate">{currentUser?.role}</p>
              </div>
            )}
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-20 border-b border-border flex items-center justify-between px-4 md:px-8 z-[60] flex-shrink-0">
          <div className="flex items-center gap-4 md:gap-8">
            {/* Mobile Logo */}
            <div className="md:hidden flex-shrink-0 w-24 h-12 flex items-center justify-center overflow-hidden">
              <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div className="relative w-96 hidden md:block group">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${isSearchFocused ? 'text-accent' : 'text-muted'}`} size={18} />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchSelectedIndex(-1);
                }}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search clients, services, or staff..." 
                className="w-full bg-surface border border-border rounded-full py-2 pl-10 pr-4 focus:outline-none focus:border-accent/50 transition-all"
              />

              {/* Search Suggestions Dropdown */}
              <AnimatePresence>
                {isSearchFocused && searchQuery.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden z-[100] max-h-[400px] overflow-y-auto custom-scrollbar"
                  >
                    {allResults.length > 0 ? (
                      <div className="p-2">
                        {allResults.map((result, index) => (
                          <button 
                            key={`${result.type}-${result.id}`}
                            onClick={() => {
                              setActiveTab(result.type as Tab);
                              setSearchQuery('');
                            }}
                            onMouseEnter={() => setSearchSelectedIndex(index)}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left group/item ${
                              searchSelectedIndex === index ? 'bg-surface-hover border-accent/30' : 'hover:bg-surface-hover'
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              result.type === 'clients' ? 'bg-blue-500/10 text-blue-500' :
                              result.type === 'pos' ? 'bg-accent/10 text-accent' :
                              'bg-purple-500/10 text-purple-500'
                            }`}>
                              {result.type === 'clients' ? <UserIcon size={16} /> :
                               result.type === 'pos' ? <Scissors size={16} /> :
                               <Users size={16} />}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-bold">
                                  {result.name.split(new RegExp(`(${searchQuery})`, 'gi')).map((part, i) => 
                                    part.toLowerCase() === searchQuery.toLowerCase() 
                                      ? <span key={i} className="text-accent">{part}</span> 
                                      : part
                                  )}
                                </p>
                                <span className="text-[8px] font-bold uppercase tracking-widest text-muted opacity-50">{result.type}</span>
                              </div>
                              <p className="text-xs text-muted truncate">
                                {'phone' in result ? result.phone : 'role' in result ? result.role : `₹${result.price}`}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center">
                        <p className="text-muted text-sm">No results found for "{searchQuery}"</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 text-right">
              <div>
                <p className="text-sm font-bold">{currentUser?.name}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-accent">{currentUser?.role}</p>
              </div>
              <div className="w-10 h-10 bg-surface border border-border rounded-xl flex items-center justify-center text-muted">
                <UserIcon size={20} />
              </div>
            </div>
            <motion.button 
              whileTap={{ scale: 0.9 }}
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-full hover:bg-surface text-muted relative transition-colors"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </motion.button>
          </div>
        </header>

        {/* Content Area */}
        <div id="main-content" className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 md:pb-8 custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ ease: [0.22, 1, 0.36, 1], duration: 0.6 }}
              className="h-full"
            >
              {activeTab === 'dashboard' && (
                <Dashboard 
                  onNavigate={setActiveTab} 
                  userName={currentUser?.name} 
                  appointments={appointments}
                  transactions={transactions}
                  setTransactions={setTransactions}
                  clients={clients}
                  setClients={setClients}
                  staff={staff}
                  settings={settings}
                />
              )}
              {activeTab === 'pos' && (
                <POS 
                  clients={clients}
                  setClients={setClients}
                  staff={staff}
                  transactions={transactions}
                  setTransactions={setTransactions}
                  services={localServices}
                  setServices={setLocalServices}
                />
              )}
              {activeTab === 'appointments' && (
                <Appointments 
                  appointments={appointments} 
                  setAppointments={setAppointments} 
                  clients={clients}
                  services={localServices}
                />
              )}
              {activeTab === 'staff' && (
                <StaffTracking 
                  staff={staff} 
                  setStaff={setStaff} 
                  transactions={transactions}
                />
              )}
              {activeTab === 'clients' && (
                <ClientDatabase 
                  clients={clients} 
                  setClients={setClients} 
                  transactions={transactions}
                />
              )}
              {activeTab === 'automations' && <AutomationSettings />}
              {activeTab === 'settings' && (
                <Settings 
                  settings={settings}
                  setSettings={setSettings}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom Navigation Bar for Mobile */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-surface/80 backdrop-blur-lg border-t border-border flex items-center justify-around px-2 z-[90] flex-shrink-0">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { id: 'pos', icon: CreditCard, label: 'POS' },
            { id: 'appointments', icon: Calendar, label: 'Calendar' },
            { id: 'clients', icon: UserCircle, label: 'Clients' },
            { id: 'more', icon: Menu, label: 'More' },
          ].map(item => (
            <button 
              key={item.id}
              type="button"
              onClick={() => {
                if (item.id === 'more') {
                  setIsMobileMoreOpen(true);
                } else {
                  setActiveTab(item.id as Tab);
                }
              }}
              className={`flex flex-col items-center justify-center flex-1 py-1 ${
                activeTab === item.id && item.id !== 'more'
                  ? 'text-accent font-semibold' 
                  : 'text-muted'
              }`}
            >
              <item.icon size={20} />
              <span className="text-[10px] mt-1">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Mobile More Options Slide-up Drawer */}
        <AnimatePresence>
          {isMobileMoreOpen && (
            <div className="fixed inset-0 z-[100] md:hidden">
              {/* Backdrop */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileMoreOpen(false)}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              />
              {/* Sheet */}
              <motion.div 
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="absolute bottom-0 left-0 right-0 bg-surface border-t border-border rounded-t-[2rem] p-6 space-y-6 max-h-[70vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <h3 className="font-bold text-lg">More Options</h3>
                  <button 
                    type="button"
                    onClick={() => setIsMobileMoreOpen(false)}
                    className="text-muted hover:text-white p-1"
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { id: 'staff', icon: Users, label: 'Staff' },
                    { id: 'settings', icon: SettingsIcon, label: 'Settings' },
                  ].map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setActiveTab(item.id as Tab);
                        setIsMobileMoreOpen(false);
                      }}
                      className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${
                        activeTab === item.id 
                          ? 'bg-accent/10 border-accent text-accent font-bold' 
                          : 'bg-surface border-border text-muted hover:text-white'
                      }`}
                    >
                      <item.icon size={24} />
                      <span className="text-xs font-semibold">{item.label}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
