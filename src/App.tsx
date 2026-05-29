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
  Sparkles,
  MapPin,
  ChevronDown,
  Sun,
  Moon,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { customers, services, staffMembers } from './data/mockData';
import { User as UserType, Branch, branches, Appointment } from './types';
import Dashboard from './components/Dashboard';
import POS from './components/POS';
import StaffTracking from './components/StaffTracking';
import ClientDatabase from './components/ClientDatabase';
import AutomationSettings from './components/AutomationSettings';
import Settings from './components/Settings';
import Login from './components/Login';
import Appointments from './components/Appointments';

type Tab = 'dashboard' | 'pos' | 'appointments' | 'staff' | 'clients' | 'automations' | 'settings';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchSelectedIndex, setSearchSelectedIndex] = useState(-1);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [isBranchMenuOpen, setIsBranchMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [appointments, setAppointments] = useState<Appointment[]>([
    {
      id: '1',
      clientName: 'Sarah Johnson',
      phone: '+919876543210',
      date: new Date().toISOString().split('T')[0], // Today
      time: '10:30 AM',
      service: 'Haircut & Styling',
      status: 'booked',
      price: 850
    },
    {
      id: '2',
      clientName: 'Michael Chen',
      phone: '+919876543211',
      date: new Date().toISOString().split('T')[0], // Today
      time: '12:00 PM',
      service: 'Beard Trim',
      status: 'booked',
      price: 350
    },
    {
      id: '3',
      clientName: 'Jessica Alba',
      phone: '+919876543212',
      date: new Date().toISOString().split('T')[0], // Today
      time: '02:30 PM',
      service: 'Full Coloring',
      status: 'booked',
      price: 2500
    },
    {
      id: '4',
      clientName: 'Jared Manuel',
      phone: '+919836682729',
      date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
      time: '11:00 AM',
      service: 'Facial Treatment',
      status: 'booked',
      price: 1200
    },
    {
      id: '5',
      clientName: 'Amit Kumar',
      phone: '+919876543211',
      date: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Yesterday
      time: '04:00 PM',
      service: 'Manicure',
      status: 'completed',
      price: 600
    }
  ]);

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, [theme]);

  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'manager') {
        setSelectedBranchId(currentUser.branchId!);
      } else {
        setSelectedBranchId(branches[0].id);
      }
    }
  }, [currentUser]);

  const handleLogin = (user: UserType) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  const selectedBranch = branches.find(b => b.id === selectedBranchId);

  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'pos', icon: CreditCard, label: 'POS / Checkout' },
    { id: 'appointments', icon: Calendar, label: 'Appointments' },
    { id: 'staff', icon: Users, label: 'Staff Tracking' },
    { id: 'clients', icon: UserCircle, label: 'Client Base' },
    { id: 'automations', icon: Bell, label: 'Automations' },
    { id: 'settings', icon: SettingsIcon, label: 'Settings' },
  ];

  const filteredClients = customers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
    (currentUser?.role === 'owner' ? c.branchId === selectedBranchId : c.branchId === currentUser?.branchId)
  );
  const filteredServices = services.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
    (currentUser?.role === 'owner' ? s.branchId === selectedBranchId : s.branchId === currentUser?.branchId)
  );
  const filteredStaff = staffMembers.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) && 
    (currentUser?.role === 'owner' ? s.branchId === selectedBranchId : s.branchId === currentUser?.branchId)
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
        className="border-r border-border flex flex-col py-8 px-4 relative z-50 bg-surface/50 backdrop-blur-md"
      >
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="absolute -right-3 top-10 w-6 h-6 bg-accent rounded-full flex items-center justify-center text-accent-foreground shadow-lg z-50 hover:scale-110 transition-transform"
        >
          {isSidebarCollapsed ? <Menu size={14} /> : <ChevronLeft size={14} />}
        </motion.button>

        <div className={`flex items-center gap-3 px-4 mb-12 ${isSidebarCollapsed ? 'justify-center' : ''}`}>
          <div className="w-10 h-10 bg-accent rounded-xl flex-shrink-0 flex items-center justify-center">
            <span className="text-black font-bold text-xl">A</span>
          </div>
          {!isSidebarCollapsed && (
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-2xl font-bold tracking-tighter"
            >
              AION
            </motion.span>
          )}
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
        <header className="h-20 border-b border-border flex items-center justify-between px-8 z-[60]">
          <div className="flex items-center gap-8">
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

            {/* Branch Switcher */}
            <div className="relative">
              <button 
                onClick={() => currentUser?.role === 'owner' && setIsBranchMenuOpen(!isBranchMenuOpen)}
                className={`flex items-center gap-3 px-4 py-2 rounded-2xl border border-border transition-all ${currentUser?.role === 'owner' ? 'hover:border-accent/50 cursor-pointer' : 'cursor-default'}`}
              >
                <div className="w-8 h-8 bg-accent/10 text-accent rounded-lg flex items-center justify-center">
                  <MapPin size={18} />
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Current Branch</p>
                  <p className="text-sm font-bold">{selectedBranch?.name}</p>
                </div>
                {currentUser?.role === 'owner' && <ChevronDown size={16} className={`text-muted transition-transform ${isBranchMenuOpen ? 'rotate-180' : ''}`} />}
              </button>

              <AnimatePresence>
                {isBranchMenuOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 mt-2 w-64 bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden z-[100]"
                  >
                    <div className="p-2">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted px-3 py-2">Switch Branch</p>
                      {branches.map(branch => (
                        <button 
                          key={branch.id}
                          onClick={() => {
                            setSelectedBranchId(branch.id);
                            setIsBranchMenuOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                            selectedBranchId === branch.id ? 'bg-accent/10 text-accent' : 'hover:bg-surface-hover'
                          }`}
                        >
                          <MapPin size={16} />
                          <span className="text-sm font-bold">{branch.name}</span>
                          {selectedBranchId === branch.id && <div className="ml-auto w-2 h-2 bg-accent rounded-full"></div>}
                        </button>
                      ))}
                    </div>
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
                <UserCircle size={24} />
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
        <div id="main-content" className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -20, filter: 'blur(4px)' }}
              transition={{ ease: [0.22, 1, 0.36, 1], duration: 0.6 }}
              className="h-full"
            >
              {activeTab === 'dashboard' && <Dashboard onNavigate={setActiveTab} branchId={selectedBranchId} userRole={currentUser?.role} userName={currentUser?.name} appointments={appointments} />}
              {activeTab === 'pos' && <POS branchId={selectedBranchId} />}
              {activeTab === 'appointments' && <Appointments appointments={appointments} setAppointments={setAppointments} />}
              {activeTab === 'staff' && <StaffTracking branchId={selectedBranchId} />}
              {activeTab === 'clients' && <ClientDatabase branchId={selectedBranchId} />}
              {activeTab === 'automations' && <AutomationSettings />}
              {activeTab === 'settings' && <Settings />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
