import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  Trash2, 
  User, 
  CreditCard, 
  Wallet, 
  Banknote,
  Percent,
  Tag,
  UserPlus,
  CheckCircle2,
  QrCode,
  Scissors,
  Wind,
  Droplets,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';

interface POSProps {
  clients: any[];
  setClients: React.Dispatch<React.SetStateAction<any[]>>;
  staff: any[];
  transactions: any[];
  setTransactions: React.Dispatch<React.SetStateAction<any[]>>;
  services: any[];
  setServices: React.Dispatch<React.SetStateAction<any[]>>;
}

export default function POS({ clients, setClients, staff, transactions, setTransactions, services, setServices }: POSProps) {
  const [cart, setCart] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [discountType, setDiscountType] = useState<'none' | 'fixed' | 'percent'>('none');
  const [discountValue, setDiscountValue] = useState(0);
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '+91' });
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [redeemedPoints, setRedeemedPoints] = useState(0);
  const [showQRModal, setShowQRModal] = useState(false);
  
  // Selected staff IDs for incentives split
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
  const [serviceSearch, setServiceSearch] = useState('');
  const [posTab, setPosTab] = useState<'services' | 'cart'>('services');

  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('');
  const [newServiceCategory, setNewServiceCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');

  const categories = ['All', ...new Set(services.map((s: any) => s.category))] as string[];
  const existingCategories = Array.from(new Set(services.filter((s: any) => !s.isPackage).map((s: any) => s.category))) as string[];

  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName || !newServicePrice) return;

    const finalCategory = newServiceCategory === 'custom' ? customCategory.trim() : newServiceCategory;
    if (!finalCategory) {
      alert('Please specify a category');
      return;
    }

    const getIconByCategory = (cat: string) => {
      const lower = cat.toLowerCase();
      if (lower.includes('hair')) return Scissors;
      if (lower.includes('nail') || lower.includes('pedi') || lower.includes('mani')) return Wind;
      if (lower.includes('color')) return Droplets;
      return Sparkles;
    };

    const newServiceObj = {
      id: `SRV-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      name: newServiceName,
      price: Number(newServicePrice),
      category: finalCategory,
      icon: getIconByCategory(finalCategory)
    };

    setServices((prev: any[]) => [...prev, newServiceObj]);
    alert('Service added successfully!');
    
    setNewServiceName('');
    setNewServicePrice('');
    setNewServiceCategory('');
    setCustomCategory('');
    setIsAddServiceOpen(false);
  };

  const addToCart = (service: any) => {
    setCart([
      ...cart, 
      { 
        ...service, 
        cartId: Math.random().toString(36).substr(2, 9),
        packageStaff: service.isPackage
          ? service.packageServices.reduce((acc: any, sub: any) => {
              acc[sub.name] = [];
              return acc;
            }, {})
          : undefined
      }
    ]);
  };

  const removeFromCart = (cartId: string) => {
    setCart(cart.filter(item => item.cartId !== cartId));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price, 0);
  
  const calculateDiscount = () => {
    if (discountType === 'fixed') return discountValue;
    if (discountType === 'percent') return (subtotal * discountValue) / 100;
    return 0;
  };

  const total = Math.max(0, subtotal - calculateDiscount() - redeemedPoints);

  const handleCustomerSelect = (customer: any) => {
    setSelectedCustomer(customer);
    setCustomerSearch('');
  };

  const filteredCustomers = clients.filter(c => 
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) || 
    c.phone.includes(customerSearch)
  );

  const finalizePayment = async () => {
    // Collect unique staff IDs across all items in the cart
    const packageStaffIds = cart.flatMap(item => 
      item.isPackage ? Object.values(item.packageStaff || {}).flat() as string[] : []
    );
    const regularStaffIds = cart.some(item => !item.isPackage) ? selectedStaffIds : [];
    const uniqueStaffIds = Array.from(new Set([...packageStaffIds, ...regularStaffIds]));
    const selectedStaffDetails = staff.filter(s => uniqueStaffIds.includes(s.id));
    const contributingStaffNames = selectedStaffDetails.map(s => s.name).join(', ');

    // Calculate specific incentives and revenue share per staff member
    const staffIncentives: Record<string, number> = {};
    const staffRevenueShare: Record<string, number> = {};

    cart.forEach(item => {
      if (item.isPackage) {
        // Proportional package price share in the total transaction amount (after discounts/redeemed points)
        const packageTotalShare = subtotal > 0 ? (item.price / subtotal) * total : 0;
        
        // Sum of sub-service original prices to distribute revenue proportionally
        const subServicesSum = item.packageServices ? item.packageServices.reduce((sum: number, sub: any) => sum + sub.price, 0) : 0;

        if (item.packageServices) {
          item.packageServices.forEach((sub: any) => {
            const assignedIds = item.packageStaff?.[sub.name] || [];
            if (assignedIds.length > 0) {
              // 5% incentive on the original sub-service price, split among contributors
              const incentiveSplit = (sub.price * 0.05) / assignedIds.length;
              
              // Revenue share of this sub-service based on the package total share
              const subServiceRevenue = subServicesSum > 0 ? (sub.price / subServicesSum) * packageTotalShare : 0;
              const revenueSplit = subServiceRevenue / assignedIds.length;

              assignedIds.forEach((id: string) => {
                staffIncentives[id] = (staffIncentives[id] || 0) + incentiveSplit;
                staffRevenueShare[id] = (staffRevenueShare[id] || 0) + revenueSplit;
              });
            }
          });
        }
      } else {
        // Regular service item: uses global selectedStaffIds
        const regularItemTotalShare = subtotal > 0 ? (item.price / subtotal) * total : 0;
        
        if (selectedStaffIds.length > 0) {
          const incentiveSplit = (item.price * 0.05) / selectedStaffIds.length;
          const revenueSplit = regularItemTotalShare / selectedStaffIds.length;

          selectedStaffIds.forEach(id => {
            staffIncentives[id] = (staffIncentives[id] || 0) + incentiveSplit;
            staffRevenueShare[id] = (staffRevenueShare[id] || 0) + revenueSplit;
          });
        }
      }
    });

    // Compute average incentive for backward compatibility
    const incentiveAmount = uniqueStaffIds.length > 0 
      ? Object.values(staffIncentives).reduce((sum, val) => sum + val, 0) / uniqueStaffIds.length
      : 0;

    // Save transaction
    const newTransaction = {
      id: `TX-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
      timestamp: new Date().toISOString(),
      clientName: selectedCustomer ? selectedCustomer.name : 'Walk-in Customer',
      phone: selectedCustomer ? selectedCustomer.phone : 'N/A',
      services: cart.map(item => item.name).join(', '),
      total: total,
      paymentMethod: selectedPaymentMethod || 'Cash',
      staffIds: uniqueStaffIds,
      staffNames: contributingStaffNames || 'None',
      incentivePerStaff: incentiveAmount,
      staffIncentives,
      staffRevenueShare
    };

    setTransactions(prev => [newTransaction, ...prev]);

    // Push new transaction to Supabase
    supabase.from('transactions').insert({
      id: newTransaction.id,
      client_name: newTransaction.clientName,
      phone: newTransaction.phone,
      services: newTransaction.services,
      total: newTransaction.total,
      payment_method: newTransaction.paymentMethod,
      created_at: newTransaction.timestamp
    }).then(({ error }) => {
      if (error) console.error("Failed to sync transaction to Supabase:", error);
    });

    // Update staff statistics in the local state
    if (uniqueStaffIds.length > 0) {
      setClients(prevClients => prevClients); // Trick to trigger sync/updates
    }

    // Update customer stats (visits, loyalty points, spent)
    if (selectedCustomer) {
      const newVisits = (selectedCustomer.visits || 0) + 1;
      const newSpent = (selectedCustomer.totalSpent || 0) + total;
      
      supabase.from('clients').upsert({
        id: selectedCustomer.id,
        name: selectedCustomer.name,
        phone: selectedCustomer.phone,
        total_visits: newVisits,
        total_spent: newSpent,
        last_visit: new Date().toISOString().split('T')[0]
      }).then(({ error }) => {
        if (error) console.error("Failed to sync client update to Supabase:", error);
      });

      setClients(prevClients => prevClients.map(client => {
        if (client.id === selectedCustomer.id) {
          const newVisitsVal = (client.visits || 0) + 1;
          const newSpentVal = (client.totalSpent || 0) + total;
          // earn 10% points on total bill
          const earnedPoints = Math.round(total * 0.1);
          const newPoints = (client.points || 0) + earnedPoints - redeemedPoints;
          return {
            ...client,
            visits: newVisitsVal,
            totalSpent: newSpentVal,
            points: newPoints,
            lastVisit: new Date().toISOString().split('T')[0],
            last30DayReminderCycle: 'pending',
            last60DayReminderCycle: 'pending'
          };
        }
        return client;
      }));
    }

    // Trigger MSG91 WhatsApp Automation
    if (selectedCustomer) {
      const servicesList = cart.map(item => item.name).join(', ');

      // 1. POS Checkout Confirmation
      try {
        await fetch('/api/automation/trigger', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'payment_received',
            customer: selectedCustomer,
            template_id: 'pos_checkout_confirmation',
            variables: [
              total.toString(),
              servicesList
            ]
          })
        });
      } catch (e) {
        console.error('Failed to trigger checkout confirmation automation:', e);
      }

      // 2. Google Review Follow-up (2 min delay handled in backend)
      try {
        await fetch('/api/automation/trigger', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'google_review_follow_up',
            customer: selectedCustomer,
            template_id: 'google_review_follow_up_text',
            variables: [
              servicesList
            ]
          })
        });
      } catch (e) {
        console.error('Failed to trigger review follow-up automation:', e);
      }

      // 3. Upsell Follow-up (6 min delay handled in backend)
      try {
        await fetch('/api/automation/trigger', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'checkout_upsell',
            customer: selectedCustomer,
            template_id: 'appointment_follow_up_upsell',
            variables: [
              "0",
              servicesList
            ]

          })
        });
      } catch (e) {
        console.error('Failed to trigger upsell automation:', e);
      }
    }

    setShowQRModal(false);
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setCart([]);
      setIsCheckoutOpen(false);
      setSelectedCustomer(null);
      setDiscountType('none');
      setDiscountValue(0);
      setRedeemedPoints(0);
      setSelectedPaymentMethod(null);
      setSelectedStaffIds([]);
    }, 3000);
  };

  const handleCompletePayment = () => {
    if (!selectedPaymentMethod) {
      alert('Please select a payment method');
      return;
    }

    if (selectedPaymentMethod === 'UPI') {
      setShowQRModal(true);
    } else {
      finalizePayment();
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ ease: [0.22, 1, 0.36, 1], duration: 0.6 }}
      className="h-[calc(100vh-11rem)] md:h-[calc(100vh-9rem)] flex flex-col md:flex-row gap-4 md:gap-8 overflow-hidden pb-4"
    >
      {/* Mobile Tab Switcher */}
      <div className="flex md:hidden bg-surface border border-border p-1 rounded-2xl gap-1 w-full flex-shrink-0">
        <button
          type="button"
          onClick={() => setPosTab('services')}
          className={`flex-1 py-3 text-center text-xs font-bold rounded-xl transition-all ${
            posTab === 'services' 
              ? 'bg-accent text-white' 
              : 'text-muted hover:text-white'
          }`}
        >
          Services ({services.length})
        </button>
        <button
          type="button"
          onClick={() => setPosTab('cart')}
          className={`flex-1 py-3 text-center text-xs font-bold rounded-xl transition-all ${
            posTab === 'cart' 
              ? 'bg-accent text-white' 
              : 'text-muted hover:text-white'
          }`}
        >
          Cart ({cart.length})
        </button>
      </div>

      {/* Services Grid */}
      <div className={`flex-1 flex flex-col overflow-hidden space-y-6 ${posTab === 'services' ? 'flex' : 'hidden md:flex'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 flex-shrink-0">
          <div className="flex gap-2 overflow-x-auto pb-1.5 custom-scrollbar">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all shrink-0 ${
                  selectedCategory === cat 
                    ? 'bg-accent text-white border border-accent' 
                    : 'bg-surface border border-border text-muted hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
              <input 
                type="text" 
                value={serviceSearch}
                onChange={(e) => setServiceSearch(e.target.value)}
                placeholder="Search services..." 
                className="w-full bg-surface/50 border border-border rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-accent/50 transition-all"
              />
            </div>
            <button 
              type="button"
              onClick={() => setIsAddServiceOpen(true)}
              className="p-2.5 bg-surface border border-border rounded-xl text-accent hover:bg-accent hover:text-white transition-all flex-shrink-0"
              title="Add New Service"
            >
              <Plus size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 overflow-y-auto custom-scrollbar pb-8">
          {services
            .filter(s => (selectedCategory === 'All' || s.category === selectedCategory) && 
                         s.name.toLowerCase().includes(serviceSearch.toLowerCase()))
            .map(service => (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                key={service.id}
                onClick={() => addToCart(service)}
                className="glass p-6 rounded-[2rem] text-left hover:border-accent/30 hover:shadow-xl transition-all duration-300 group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-surface rounded-2xl text-accent group-hover:bg-accent group-hover:text-white transition-all">
                    <Plus size={20} />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest text-muted">{service.category}</span>
                </div>
                <h4 className="font-bold text-lg mb-1">{service.name}</h4>
                <p className="text-accent font-bold">₹{service.price}</p>
              </motion.button>
            ))}
        </div>
      </div>

      {/* Cart Sidebar */}
      <div className={`w-full md:w-[400px] glass rounded-[2rem] md:rounded-[2.5rem] flex flex-col overflow-hidden shadow-2xl h-full ${posTab === 'cart' ? 'flex' : 'hidden md:flex'}`}>
        <div className="p-6 border-b border-border flex-shrink-0">
          <h3 className="text-xl font-bold mb-4">Current Order</h3>
          
          {/* Customer Selection */}
          {!selectedCustomer ? (
            <div className="relative">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
                  <input 
                    type="text" 
                    placeholder="Search customer..." 
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="w-full bg-surface border border-border rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-accent/50"
                  />
                </div>
                <button 
                  onClick={() => setShowCustomerForm(true)}
                  className="p-2 bg-surface border border-border rounded-xl text-accent hover:bg-accent hover:text-white transition-all"
                  title="Add New Customer"
                >
                  <UserPlus size={20} />
                </button>
              </div>
              
              {customerSearch && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-surface border border-border rounded-xl shadow-2xl z-50 overflow-hidden max-h-48 overflow-y-auto">
                  {filteredCustomers.map(c => (
                    <button
                      key={c.id}
                      onClick={() => handleCustomerSelect(c)}
                      className="w-full p-3 text-left hover:bg-white/5 transition-all flex items-center justify-between"
                    >
                      <div>
                        <p className="font-bold text-sm">{c.name}</p>
                        <p className="text-[10px] text-muted">{c.phone}</p>
                      </div>
                      <span className="text-[10px] bg-accent/10 text-accent px-2 py-1 rounded-full">{c.points || 0} pts</span>
                    </button>
                  ))}
                  {filteredCustomers.length === 0 && (
                    <div className="p-3 text-sm text-muted text-center">No customers found</div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-accent/10 border border-accent/20 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-white font-bold">
                  {selectedCustomer.name[0]}
                </div>
                <div>
                  <p className="font-bold text-sm">{selectedCustomer.name}</p>
                  <p className="text-[10px] text-muted">{selectedCustomer.phone}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedCustomer(null)}
                className="text-muted hover:text-red-500 transition-all"
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}

          {/* Contributing Staff Multi-Select */}
          {cart.some(item => !item.isPackage) && (
            <div className="space-y-2 mt-4 pt-4 border-t border-border">
              <label className="text-xs font-bold uppercase tracking-widest text-muted block">Contributing Staff</label>
              {staff.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {staff.map(member => {
                    const isSelected = selectedStaffIds.includes(member.id);
                    return (
                      <button
                        key={member.id}
                        type="button"
                        onClick={() => {
                          setSelectedStaffIds(prev => 
                            isSelected ? prev.filter(id => id !== member.id) : [...prev, member.id]
                          );
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                          isSelected 
                            ? 'bg-accent text-white border-accent' 
                            : 'bg-surface border-border text-muted hover:text-white hover:border-accent/30'
                        }`}
                      >
                        {member.name}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-muted italic">Add staff members in the Staff Tracking tab to choose contributors.</p>
              )}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          <AnimatePresence>
            {cart.map((item) => (               <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                key={item.cartId}
                className="flex flex-col p-4 bg-surface rounded-2xl border border-border group gap-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm">{item.name}</p>
                    <p className="text-xs text-accent font-bold">₹{item.price}</p>
                  </div>
                  <button 
                    onClick={() => removeFromCart(item.cartId)}
                    className="p-2 text-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                
                {/* Package Sub-Service Staff Assignment Badges */}
                {item.isPackage && item.packageServices && (
                  <div className="pt-3 border-t border-border/40 space-y-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Package Services Staff Assignment</p>
                    {item.packageServices.map((sub: any) => {
                      const assignedIds = item.packageStaff?.[sub.name] || [];
                      return (
                        <div key={sub.name} className="bg-background/40 p-3 rounded-xl border border-border/30">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-white">{sub.name}</span>
                            <span className="text-[10px] text-muted font-bold">Valued at: ₹{sub.price}</span>
                          </div>
                          {staff.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {staff.map(member => {
                                const isAssigned = assignedIds.includes(member.id);
                                return (
                                  <button
                                    key={member.id}
                                    type="button"
                                    onClick={() => {
                                      const currentStaffIds = assignedIds;
                                      const newStaffIds = currentStaffIds.includes(member.id)
                                        ? currentStaffIds.filter(id => id !== member.id)
                                        : [...currentStaffIds, member.id];
                                      
                                      setCart(prev => prev.map(cartItem => 
                                        cartItem.cartId === item.cartId 
                                          ? {
                                              ...cartItem,
                                              packageStaff: {
                                                ...cartItem.packageStaff,
                                                [sub.name]: newStaffIds
                                              }
                                            }
                                          : cartItem
                                      ));
                                    }}
                                    className={`px-2 py-0.5 rounded-lg text-[9px] font-bold transition-all border ${
                                      isAssigned 
                                        ? 'bg-accent text-white border-accent' 
                                        : 'bg-background border-border text-muted hover:text-white hover:border-accent/30'
                                    }`}
                                  >
                                    {member.name}
                                  </button>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-[9px] text-muted italic">No staff found. Add staff in the Staff Tracking tab.</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          {cart.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-muted space-y-4 py-12">
              <CreditCard size={48} strokeWidth={1} />
              <p className="text-sm">Your cart is empty</p>
            </div>
          )}
        </div>

        <div className="p-6 bg-surface border-t border-border space-y-4 flex-shrink-0">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted">Subtotal</span>
              <span className="font-bold">₹{subtotal}</span>
            </div>
            
            {/* Discount Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">Discount</span>
                <div className="flex gap-1">
                  <button 
                    onClick={() => setDiscountType(discountType === 'percent' ? 'none' : 'percent')}
                    className={`p-1.5 rounded-lg border transition-all ${discountType === 'percent' ? 'bg-accent border-accent text-white' : 'border-border text-muted'}`}
                  >
                    <Percent size={14} />
                  </button>
                  <button 
                    onClick={() => setDiscountType(discountType === 'fixed' ? 'none' : 'fixed')}
                    className={`p-1.5 rounded-lg border transition-all ${discountType === 'fixed' ? 'bg-accent border-accent text-white' : 'border-border text-muted'}`}
                  >
                    <Tag size={14} />
                  </button>
                </div>
              </div>
              {discountType !== 'none' && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="flex items-center gap-2"
                >
                  <input 
                    type="number" 
                    placeholder={discountType === 'percent' ? '%' : '₹'}
                    value={discountValue || ''}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    className="flex-1 bg-background border border-border rounded-lg py-1.5 px-3 text-sm focus:outline-none focus:border-accent/50"
                  />
                  <span className="text-xs font-bold text-red-500">-₹{calculateDiscount()}</span>
                </motion.div>
              )}
            </div>

            {/* Points Redemption */}
            {selectedCustomer && selectedCustomer.points > 0 && (
              <div className="space-y-2 pt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted">Redeem Points (Available: {selectedCustomer.points})</span>
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="number" 
                    placeholder="0"
                    max={selectedCustomer.points}
                    value={redeemedPoints || ''}
                    onChange={(e) => setRedeemedPoints(Math.min(Number(e.target.value), selectedCustomer.points))}
                    className="flex-1 bg-background border border-border rounded-lg py-1.5 px-3 text-sm focus:outline-none focus:border-accent/50"
                  />
                  {redeemedPoints > 0 && (
                    <span className="text-xs font-bold text-red-500">-₹{redeemedPoints}</span>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-between text-xl font-bold pt-2 border-t border-border">
              <span>Total</span>
              <span className="text-accent">₹{total}</span>
            </div>
          </div>
          <button 
            disabled={cart.length === 0}
            onClick={() => {
              const hasPackages = cart.some(item => item.isPackage);
              const hasRegular = cart.some(item => !item.isPackage);

              if (hasPackages) {
                for (const item of cart) {
                  if (item.isPackage && item.packageServices) {
                    for (const sub of item.packageServices) {
                      const assigned = item.packageStaff?.[sub.name] || [];
                      if (assigned.length === 0) {
                        alert(`Please assign at least one contributing staff member to the ${sub.name} service inside the ${item.name}.`);
                        return;
                      }
                    }
                  }
                }
              }

              if (hasRegular && selectedStaffIds.length === 0) {
                alert('Please select at least one contributing staff member in the sidebar.');
                return;
              }

              setIsCheckoutOpen(true);
            }}
            className="w-full bg-accent text-white py-4 rounded-2xl font-bold text-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-accent/20"
          >
            Checkout
          </button>
        </div>
      </div>

      {/* Checkout Modal */}
      <AnimatePresence>
        {isCheckoutOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCheckoutOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md glass rounded-[2.5rem] p-8 space-y-8"
            >
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-2">Complete Payment</h3>
                <p className="text-muted">Select payment method for ₹{total}</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <PaymentMethod 
                  icon={Banknote} 
                  label="Cash" 
                  selected={selectedPaymentMethod === 'Cash'} 
                  onClick={() => setSelectedPaymentMethod('Cash')} 
                />
                <PaymentMethod 
                  icon={CreditCard} 
                  label="Card" 
                  selected={selectedPaymentMethod === 'Card'} 
                  onClick={() => setSelectedPaymentMethod('Card')} 
                />
                <PaymentMethod 
                  icon={Wallet} 
                  label="UPI / QR" 
                  selected={selectedPaymentMethod === 'UPI'} 
                  onClick={() => setSelectedPaymentMethod('UPI')} 
                />
              </div>

              <div className="space-y-4">
                <button 
                  onClick={handleCompletePayment}
                  className="w-full bg-accent text-white py-4 rounded-2xl font-bold text-lg hover:opacity-90 transition-all"
                >
                  Confirm Payment
                </button>
                <button 
                  onClick={() => setIsCheckoutOpen(false)}
                  className="w-full py-4 rounded-2xl font-bold text-muted hover:text-white transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* QR Code Modal */}
      <AnimatePresence>
        {showQRModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm glass rounded-[2.5rem] p-8 space-y-8 flex flex-col items-center"
            >
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-2">Scan to Pay</h3>
                <p className="text-muted">Pay ₹{total} via UPI</p>
              </div>

              <div className="w-48 h-48 bg-white rounded-2xl p-4 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 border-4 border-accent/50 rounded-2xl animate-pulse pointer-events-none"></div>
                <QrCode size={120} className="text-black" />
              </div>

              <div className="w-full space-y-4">
                <motion.button 
                  whileTap={{ scale: 0.95 }}
                  onClick={finalizePayment}
                  className="w-full bg-green-500 text-white py-4 rounded-2xl font-bold text-lg hover:opacity-90 transition-all shadow-lg shadow-green-500/20"
                >
                  Payment Done
                </motion.button>
                <motion.button 
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowQRModal(false)}
                  className="w-full py-4 rounded-2xl font-bold text-muted hover:text-white transition-all"
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* New Customer Modal */}
      <AnimatePresence>
        {showCustomerForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCustomerForm(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-sm glass rounded-[2rem] p-8 space-y-6"
            >
              <h3 className="text-xl font-bold">Add New Customer</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-muted mb-2 block">Full Name</label>
                  <input 
                    type="text" 
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                    className="w-full bg-surface border border-border rounded-xl py-3 px-4 focus:outline-none focus:border-accent/50"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-muted mb-2 block">Phone Number</label>
                  <input 
                    type="text" 
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                    placeholder="+91..."
                    className="w-full bg-surface border border-border rounded-xl py-3 px-4 focus:outline-none focus:border-accent/50"
                  />
                </div>
              </div>
              <div className="flex gap-4 pt-4">
                <button 
                  onClick={() => {
                    if (!newCustomer.name || !newCustomer.phone) {
                      alert('Please enter Name and Phone Number');
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
                    const formattedPhone = formatPhoneNumber(newCustomer.phone);
                    const customer = { 
                      id: `CL-${Math.random().toString(36).substring(2, 9).toUpperCase()}`, 
                      name: newCustomer.name, 
                      phone: formattedPhone,
                      points: 0,
                      visits: 0,
                      totalSpent: 0,
                      lastVisit: 'N/A',
                      frequent: []
                    };
                    
                    supabase.from('clients').insert({
                      id: customer.id,
                      name: customer.name,
                      phone: customer.phone,
                      total_visits: 0,
                      total_spent: 0,
                      last_visit: null
                    }).then(({ error }) => {
                      if (error) console.error("Failed to sync new customer to Supabase:", error);
                    });

                    setClients(prev => [...prev, customer]);
                    setSelectedCustomer(customer);
                    setShowCustomerForm(false);
                    setNewCustomer({ name: '', phone: '+91' });
                  }}
                  className="flex-1 bg-accent text-white py-3 rounded-xl font-bold hover:opacity-90 transition-all"
                >
                  Add Customer
                </button>
                <button 
                  onClick={() => setShowCustomerForm(false)}
                  className="flex-1 py-3 rounded-xl font-bold text-muted hover:text-white transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add New Service Modal */}
      <AnimatePresence>
        {isAddServiceOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddServiceOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-sm glass rounded-[2rem] p-8 space-y-6"
            >
              <h3 className="text-xl font-bold">Add New Service</h3>
              
              <form onSubmit={handleAddService} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted block">Service Name</label>
                  <input 
                    type="text" 
                    value={newServiceName}
                    onChange={(e) => setNewServiceName(e.target.value)}
                    placeholder="e.g., Keratin Hair Spa"
                    className="w-full bg-surface border border-border rounded-xl py-3 px-4 focus:outline-none focus:border-accent/50 text-sm"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted block">Price (INR)</label>
                  <input 
                    type="number" 
                    value={newServicePrice}
                    onChange={(e) => setNewServicePrice(e.target.value)}
                    placeholder="e.g., 1200"
                    className="w-full bg-surface border border-border rounded-xl py-3 px-4 focus:outline-none focus:border-accent/50 text-sm"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted block">Category</label>
                  <select
                    value={newServiceCategory}
                    onChange={(e) => setNewServiceCategory(e.target.value)}
                    className="w-full bg-surface border border-border rounded-xl py-3 px-4 focus:outline-none focus:border-accent/50 text-sm"
                    required
                  >
                    <option value="" className="bg-surface text-white">Select Category</option>
                    {existingCategories.map(cat => (
                      <option key={cat} value={cat} className="bg-surface text-white">{cat}</option>
                    ))}
                    <option value="custom" className="bg-surface text-accent font-bold">+ Create Custom Category</option>
                  </select>
                </div>

                {newServiceCategory === 'custom' && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-muted block">Custom Category Name</label>
                    <input 
                      type="text" 
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      placeholder="e.g., Spa"
                      className="w-full bg-surface border border-border rounded-xl py-3 px-4 focus:outline-none focus:border-accent/50 text-sm"
                      required
                    />
                  </div>
                )}

                <div className="flex gap-4 pt-4">
                  <button 
                    type="submit"
                    className="flex-1 bg-accent text-white py-3 rounded-xl font-bold hover:opacity-90 transition-all"
                  >
                    Add Service
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      setIsAddServiceOpen(false);
                      setNewServiceName('');
                      setNewServicePrice('');
                      setNewServiceCategory('');
                      setCustomCategory('');
                    }}
                    className="flex-1 py-3 rounded-xl font-bold text-muted hover:text-white transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Success Overlay */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center bg-background/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="glass p-12 rounded-[40px] flex flex-col items-center text-center space-y-6"
            >
              <div className="w-24 h-24 bg-accent rounded-full flex items-center justify-center text-white">
                <CheckCircle2 size={48} />
              </div>
              <div>
                <h2 className="text-3xl font-bold">Payment Successful</h2>
                <p className="text-muted mt-2">Transaction completed</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function PaymentMethod({ icon: Icon, label, selected, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-3 p-6 rounded-3xl bg-surface border transition-all group ${
        selected ? 'border-accent bg-accent/10' : 'border-border hover:border-accent/50 hover:bg-accent/5'
      }`}
    >
      <div className={`p-3 bg-background rounded-2xl transition-all ${
        selected ? 'text-accent' : 'text-muted group-hover:text-accent'
      }`}>
        <Icon size={24} />
      </div>
      <span className={`text-sm font-bold ${selected ? 'text-accent' : ''}`}>{label}</span>
    </button>
  );
}

const Star = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);
