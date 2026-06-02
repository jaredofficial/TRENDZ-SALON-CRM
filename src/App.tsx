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
import { customers as initialCustomers, services, staffMembers as initialStaff } from './data/mockData';
import { User as UserType, branches, Appointment } from './types';
import Dashboard from './components/Dashboard';
import POS from './components/POS';
import StaffTracking from './components/StaffTracking';
import ClientDatabase from './components/ClientDatabase';
import AutomationSettings from './components/AutomationSettings';
import Settings from './components/Settings';
import Login from './components/Login';
import Appointments from './components/Appointments';
import logoUrl from './logo.png';

type Tab = 'dashboard' | 'pos' | 'appointments' | 'staff' | 'clients' | 'automations' | 'settings';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
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
    return saved ? JSON.parse(saved) : [];
  });

  const [transactions, setTransactions] = useState<any[]>(() => {
    const saved = localStorage.getItem('trendz_transactions');
    return saved ? JSON.parse(saved) : [];
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
    { id: 'automations', icon: Bell, label: 'Automations' },
    { id: 'settings', icon: SettingsIcon, label: 'Settings' },
  ];

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredServices = services.filter(s => 
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

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
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
          <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
            className={`w-full flex items-center gap-4 p-3 rounded-xl text-red-500 hover:bg-red-500/10 transition-all ${isSidebarCollapsed ? 'justify-center px-0' : ''}`}
          >
            <LogOut size={24} className="flex-shrink-0" />
            {!isSidebarCollapsed && <span className="font-bold">Logout</span>}
          </motion.button>
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
              initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -20, filter: 'blur(4px)' }}
              transition={{ ease: [0.22, 1, 0.36, 1], duration: 0.6 }}
              className="h-full"
            >
              {activeTab === 'dashboard' && (
                <Dashboard 
                  onNavigate={setActiveTab} 
                  userName={currentUser?.name} 
                  appointments={appointments}
                  transactions={transactions}
                  clients={clients}
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
                />
              )}
              {activeTab === 'appointments' && (
                <Appointments 
                  appointments={appointments} 
                  setAppointments={setAppointments} 
                  clients={clients}
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
                    { id: 'automations', icon: Bell, label: 'Automations' },
                    { id: 'settings', icon: SettingsIcon, label: 'Settings' },
                    { id: 'logout', icon: LogOut, label: 'Logout' },
                  ].map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        if (item.id === 'logout') {
                          handleLogout();
                        } else {
                          setActiveTab(item.id as Tab);
                        }
                        setIsMobileMoreOpen(false);
                      }}
                      className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${
                        activeTab === item.id 
                          ? 'bg-accent/10 border-accent text-accent font-bold' 
                          : 'bg-surface border-border text-muted hover:text-white'
                      }`}
                    >
                      <item.icon size={24} className={item.id === 'logout' ? 'text-red-500' : ''} />
                      <span className={`text-xs font-semibold ${item.id === 'logout' ? 'text-red-500' : ''}`}>{item.label}</span>
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
