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
  Sparkles,
  Sliders
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

  const [activeConfigCartId, setActiveConfigCartId] = useState<string | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '+91' });
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [redeemedPoints, setRedeemedPoints] = useState(0);

  const [isProcessing, setIsProcessing] = useState(false);
  const [includePastDues, setIncludePastDues] = useState(false);
  const [customAmountPaid, setCustomAmountPaid] = useState<string>('');
  
  const [serviceSearch, setServiceSearch] = useState('');
  const [posTab, setPosTab] = useState<'services' | 'cart'>('services');

  const activeConfigItem = cart.find(item => item.cartId === activeConfigCartId);

  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('');
  const [newServiceCategory, setNewServiceCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');

  const getSimpleCategory = (cat: string): string => {
    const c = (cat || '').toLowerCase();
    if (c.includes('hair') || c.includes('straight') || c.includes('smooth') || c.includes('styling') || c.includes('cut')) return 'Hair';
    if (c.includes('skin') || c.includes('face') || c.includes('facial')) return 'Skin';
    if (c.includes('nail') || c.includes('mani') || c.includes('pedi')) return 'Nails';
    if (c.includes('massage') || c.includes('spa')) return 'Spa & Massage';
    if (c.includes('threading') || c.includes('wax')) return 'Waxing & Threading';
    if (c.includes('package')) return 'Packages';
    return 'Others';
  };

  const mappedServices = services.map(s => ({
    ...s,
    category: getSimpleCategory(s.category)
  }));

  const categories = ['All', ...new Set(mappedServices.map((s: any) => s.category))] as string[];
  const existingCategories = Array.from(new Set(mappedServices.filter((s: any) => !s.isPackage).map((s: any) => s.category))) as string[];

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
        cartId: Math.random().toString(36).substring(2, 9),
        discountType: 'none',
        discountValue: 0,
        staffIds: service.isPackage ? undefined : [],
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

  const getItemDiscount = (item: any) => {
    if (item.discountType === 'fixed') return item.discountValue || 0;
    if (item.discountType === 'percent') return Math.round((item.price * (item.discountValue || 0)) / 100);
    return 0;
  };

  const getItemFinalPrice = (item: any) => {
    return Math.max(0, item.price - getItemDiscount(item));
  };

  const discountedSubtotal = cart.reduce((sum, item) => sum + getItemFinalPrice(item), 0);
  const totalDiscount = cart.reduce((sum, item) => sum + getItemDiscount(item), 0);

  const total = Math.max(0, discountedSubtotal - redeemedPoints);
  const pastDues = selectedCustomer ? (selectedCustomer.dueAmount || 0) : 0;
  const totalWithDues = includePastDues ? (total + pastDues) : total;
  const actualPaid = customAmountPaid !== '' ? Number(customAmountPaid) : totalWithDues;
  const remainingOutstanding = Math.max(0, (total + pastDues) - actualPaid);

  const handleCustomerSelect = (customer: any) => {
    setSelectedCustomer(customer);
    setCustomerSearch('');
    setIncludePastDues(false);
    setCustomAmountPaid('');
  };

  const filteredCustomers = clients.filter(c => 
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) || 
    c.phone.includes(customerSearch)
  );

  const finalizePayment = async () => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const pastDues = selectedCustomer ? (selectedCustomer.dueAmount || 0) : 0;
      const totalWithDues = includePastDues ? (total + pastDues) : total;
      const actualPaid = customAmountPaid !== '' ? Number(customAmountPaid) : totalWithDues;
      const newDueAmount = Math.max(0, (total + pastDues) - actualPaid);

      // Collect unique staff IDs across all items in the cart
      const packageStaffIds = cart.flatMap(item => 
        item.isPackage ? Object.values(item.packageStaff || {}).flat() as string[] : []
      );
      const regularStaffIds = cart.flatMap(item => 
        !item.isPackage ? (item.staffIds || []) : []
      );
      const uniqueStaffIds = Array.from(new Set([...packageStaffIds, ...regularStaffIds]));
      const selectedStaffDetails = staff.filter(s => uniqueStaffIds.includes(s.id));
      const contributingStaffNames = selectedStaffDetails.map(s => s.name).join(', ');

      // Calculate specific incentives and revenue share per staff member
      const staffIncentives: Record<string, number> = {};
      const staffRevenueShare: Record<string, number> = {};

      cart.forEach(item => {
        const itemFinalPrice = getItemFinalPrice(item);
        if (item.isPackage) {
          // Proportional package price share in the total transaction amount (after discounts/redeemed points)
          const packageTotalShare = discountedSubtotal > 0 ? (itemFinalPrice / discountedSubtotal) * total : 0;
          
          const numServices = item.packageServices ? item.packageServices.length : 0;

          if (numServices > 0 && item.packageServices) {
            // Each sub-service is valued equally on the package price
            const subServicePrice = itemFinalPrice / numServices;
            // Each sub-service share of the final total billed amount
            const subServiceBilledShare = packageTotalShare / numServices;

            item.packageServices.forEach((sub: any) => {
              const assignedIds = item.packageStaff?.[sub.name] || [];
              if (assignedIds.length > 0) {
                // 5% incentive on the equal service price split, split among contributors
                const incentiveSplit = (subServicePrice * 0.05) / assignedIds.length;
                
                // Revenue share based on equal billed amount split, split among contributors
                const revenueSplit = subServiceBilledShare / assignedIds.length;

                assignedIds.forEach((id: string) => {
                  staffIncentives[id] = (staffIncentives[id] || 0) + incentiveSplit;
                  staffRevenueShare[id] = (staffRevenueShare[id] || 0) + revenueSplit;
                });
              }
            });
          }
        } else {
          // Regular service item: uses its own staffIds
          const regularItemTotalShare = discountedSubtotal > 0 ? (itemFinalPrice / discountedSubtotal) * total : 0;
          const assignedIds = item.staffIds || [];
          
          if (assignedIds.length > 0) {
            const incentiveSplit = (itemFinalPrice * 0.05) / assignedIds.length;
            const revenueSplit = regularItemTotalShare / assignedIds.length;

            assignedIds.forEach((id: string) => {
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
        services: cart.map(item => item.name).join(', ') + 
                  (includePastDues ? ` (Paid Past Dues: ₹${pastDues})` : '') +
                  (newDueAmount > 0 ? ` (Remaining Due: ₹${newDueAmount})` : ''),
        total: actualPaid,
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
        const newSpent = (selectedCustomer.totalSpent || 0) + actualPaid;
        
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
            const newSpentVal = (client.totalSpent || 0) + actualPaid;
            // earn 10% points on actual payment amount
            const earnedPoints = Math.round(actualPaid * 0.1);
            const newPoints = Math.max(0, (client.points || 0) + earnedPoints - redeemedPoints);
            return {
              ...client,
              visits: newVisitsVal,
              totalSpent: newSpentVal,
              points: newPoints,
              dueAmount: newDueAmount,
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
        const servicesList = cart.map(item => item.name).join(', ') + 
                             (includePastDues ? ` (Paid Past Dues: ₹${pastDues})` : '') +
                             (newDueAmount > 0 ? ` (Remaining Due: ₹${newDueAmount})` : '');

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
                actualPaid.toString(),
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
    } catch (err) {
      console.error('Error during finalizePayment:', err);
    } finally {
      setIsProcessing(false);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setCart([]);
        setIsCheckoutOpen(false);
        setSelectedCustomer(null);
        setRedeemedPoints(0);
        setSelectedPaymentMethod(null);
        setIncludePastDues(false);
        setCustomAmountPaid('');
      }, 3000);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
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
          {mappedServices
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
            <div className="flex flex-col gap-2">
              <div className="bg-accent/10 border border-accent/20 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-white font-bold">
                    {selectedCustomer.name[0]}
                  </div>
                  <div>
                    <p className="font-bold text-sm">{selectedCustomer.name}</p>
                    <div className="flex flex-wrap gap-x-2 text-[10px] text-muted font-medium">
                      <span>{selectedCustomer.phone}</span>
                      <span>•</span>
                      <span className="text-accent font-bold">{selectedCustomer.points || 0} pts</span>
                      {(selectedCustomer.dueAmount || 0) > 0 && (
                        <>
                          <span>•</span>
                          <span className="text-red-500 font-bold">Dues: ₹{selectedCustomer.dueAmount}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setSelectedCustomer(null);
                    setIncludePastDues(false);
                    setCustomAmountPaid('');
                  }}
                  className="text-muted hover:text-red-500 transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              {selectedCustomer.dueAmount && selectedCustomer.dueAmount > 0 ? (
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider">Outstanding Dues</p>
                      <p className="font-bold text-base text-red-500">₹{selectedCustomer.dueAmount.toLocaleString()}</p>
                    </div>
                    <button
                      onClick={() => setIncludePastDues(!includePastDues)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        includePastDues 
                          ? 'bg-red-500 text-white shadow-md shadow-red-500/20' 
                          : 'bg-surface border border-border text-muted hover:text-white'
                      }`}
                    >
                      {includePastDues ? 'Dues Included' : 'Add to Bill'}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          )}


        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          <AnimatePresence>
            {cart.map((item) => {
              const hasStaffAssigned = item.isPackage
                ? item.packageServices && Object.values(item.packageStaff || {}).every((sids: any) => sids.length > 0)
                : (item.staffIds || []).length > 0;

              const discountAmt = getItemDiscount(item);
              const finalItemPrice = getItemFinalPrice(item);
              
              return (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  key={item.cartId}
                  className="flex flex-col p-4 bg-surface rounded-2xl border border-border group gap-2 hover:border-accent/30 transition-all duration-300"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="font-bold text-sm truncate text-white">{item.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs font-bold ${discountAmt > 0 ? 'text-muted line-through' : 'text-accent'}`}>
                          ₹{item.price}
                        </span>
                        {discountAmt > 0 && (
                          <span className="text-xs text-green-400 font-bold">
                            ₹{finalItemPrice}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button 
                        type="button"
                        onClick={() => setActiveConfigCartId(item.cartId)}
                        className={`p-2 rounded-xl border transition-all ${
                          hasStaffAssigned 
                            ? 'border-green-500/30 text-green-400 hover:bg-green-500/10' 
                            : 'border-border text-muted hover:text-white hover:bg-surface-hover'
                        }`}
                        title="Configure service"
                      >
                        <Sliders size={15} />
                      </button>
                      <button 
                        type="button"
                        onClick={() => removeFromCart(item.cartId)}
                        className="p-2 text-muted hover:text-red-500 transition-all"
                        title="Delete service"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Summary badges */}
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {/* Staff Badge */}
                    {hasStaffAssigned ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500/10 text-green-400 rounded-full text-[10px] font-bold border border-green-500/20">
                        Staff Configured
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-500/10 text-yellow-500 rounded-full text-[10px] font-bold border border-yellow-500/20">
                        Assign Staff
                      </span>
                    )}

                    {/* Discount Badge */}
                    {discountAmt > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-500/10 text-red-500 rounded-full text-[10px] font-bold border border-red-500/20">
                        {item.discountType === 'percent' ? `${item.discountValue}%` : `₹${item.discountValue}`} Off
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
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

            {totalDiscount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted">Discount</span>
                <span className="font-bold text-red-500">-₹{totalDiscount}</span>
              </div>
            )}
            
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

            {selectedCustomer && includePastDues && (selectedCustomer.dueAmount || 0) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted">Past Dues Included</span>
                <span className="font-bold text-red-500">+₹{selectedCustomer.dueAmount}</span>
              </div>
            )}

            <div className="flex justify-between text-xl font-bold pt-2 border-t border-border">
              <span>Total Due</span>
              <span className="text-accent">₹{includePastDues ? (total + (selectedCustomer?.dueAmount || 0)) : total}</span>
            </div>
          </div>

          <button 
            type="button"
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

              if (hasRegular) {
                for (const item of cart) {
                  if (!item.isPackage) {
                    const assigned = item.staffIds || [];
                    if (assigned.length === 0) {
                      alert(`Please assign at least one contributing staff member to the ${item.name} service.`);
                      return;
                    }
                  }
                }
              }

              setIsCheckoutOpen(true);
            }}
            className="w-full bg-accent text-white py-4 rounded-2xl font-bold text-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-accent/20 animate-pulse-slow"
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
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md glass rounded-[2.5rem] p-8 space-y-6 flex flex-col max-h-[90vh] overflow-y-auto"
            >
              <div className="text-center">
                <h3 className="text-2xl font-bold mb-1">Complete Checkout</h3>
                {selectedCustomer ? (
                  <p className="text-sm text-accent font-bold">
                    Client: {selectedCustomer.name} ({selectedCustomer.phone})
                  </p>
                ) : (
                  <p className="text-xs text-muted">Walk-in Customer</p>
                )}
              </div>

              {/* Dues & Points Settlement Breakdown */}
              {selectedCustomer && (
                <div className="bg-background/40 border border-border/50 rounded-3xl p-5 space-y-3.5 text-sm">
                  <div className="flex justify-between items-center text-muted">
                    <span>Current Bill:</span>
                    <span className="font-bold text-white">₹{total.toLocaleString()}</span>
                  </div>
                  
                  {pastDues > 0 && (
                    <div className="flex justify-between items-center text-muted">
                      <span>Previous Outstanding Dues:</span>
                      <span className={`font-bold ${includePastDues ? 'text-red-500' : 'text-muted/60'}`}>
                        ₹{pastDues.toLocaleString()}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-2 border-t border-border/30 text-base font-bold">
                    <span>Total Due:</span>
                    <span className="text-white">₹{(total + pastDues).toLocaleString()}</span>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-border/30">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold uppercase tracking-widest text-muted block">Amount Paid Today (₹)</label>
                      <button 
                        onClick={() => setCustomAmountPaid('')}
                        className="text-xs font-bold text-accent hover:underline"
                        type="button"
                      >
                        Reset to Full
                      </button>
                    </div>
                    <input 
                      type="number"
                      placeholder="Enter amount..."
                      max={total + pastDues}
                      min={0}
                      value={customAmountPaid}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '') {
                          setCustomAmountPaid('');
                        } else {
                          const num = Math.min(total + pastDues, Math.max(0, Number(val)));
                          setCustomAmountPaid(num.toString());
                        }
                      }}
                      className="w-full bg-surface border border-border rounded-xl py-2.5 px-4 focus:outline-none focus:border-accent/50 text-white font-bold"
                    />
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-muted">Remaining Balance:</span>
                    <span className={`font-bold ${remainingOutstanding > 0 ? 'text-red-500' : 'text-green-500'}`}>
                      ₹{remainingOutstanding.toLocaleString()}
                    </span>
                  </div>
                  
                  {remainingOutstanding > 0 && (
                    <p className="text-[10px] text-red-400/80 leading-relaxed text-center">
                      * ₹{remainingOutstanding.toLocaleString()} will remain as the customer's outstanding balance.
                    </p>
                  )}
                </div>
              )}

              {/* Payment Methods */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted block text-center">Select Payment Method</label>
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentMethod('Cash')}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border text-xs font-bold transition-all ${
                      selectedPaymentMethod === 'Cash'
                        ? 'border-accent bg-accent/10 text-accent'
                        : 'border-border hover:border-accent/30 text-muted hover:text-white'
                    }`}
                  >
                    <Banknote size={16} />
                    <span>Cash</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentMethod('Card')}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border text-xs font-bold transition-all ${
                      selectedPaymentMethod === 'Card'
                        ? 'border-accent bg-accent/10 text-accent'
                        : 'border-border hover:border-accent/30 text-muted hover:text-white'
                    }`}
                  >
                    <CreditCard size={16} />
                    <span>Card</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentMethod('UPI')}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl border text-xs font-bold transition-all ${
                      selectedPaymentMethod === 'UPI'
                        ? 'border-accent bg-accent/10 text-accent'
                        : 'border-border hover:border-accent/30 text-muted hover:text-white'
                    }`}
                  >
                    <Wallet size={16} />
                    <span>UPI / QR</span>
                  </button>
                </div>
              </div>

              {/* UPI QR Display (Inline in Modal) */}
              {selectedPaymentMethod === 'UPI' && (
                <div className="bg-white rounded-3xl p-5 flex flex-col items-center justify-center gap-3 border border-border/50 shadow-inner">
                  <div className="relative border-4 border-accent/20 rounded-2xl p-2 bg-white">
                    <div className="absolute inset-0 border-4 border-accent/40 rounded-2xl animate-pulse pointer-events-none"></div>
                    <QrCode size={110} className="text-black" />
                  </div>
                  <p className="text-[11px] text-zinc-600 font-bold text-center">Scan to Pay ₹{actualPaid.toLocaleString()} via UPI</p>
                </div>
              )}

              {/* Modal Actions */}
              <div className="space-y-3 pt-2">
                <button 
                  type="button"
                  disabled={isProcessing || !selectedPaymentMethod}
                  onClick={finalizePayment}
                  className="w-full bg-accent text-white py-3.5 rounded-2xl font-bold text-base hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-accent/20"
                >
                  {!selectedPaymentMethod ? 'Select Payment Method' : 'Confirm Payment'}
                </button>
                <button 
                  type="button"
                  disabled={isProcessing}
                  onClick={() => {
                    setIsCheckoutOpen(false);
                    setSelectedPaymentMethod(null);
                  }}
                  className="w-full py-3 rounded-2xl font-bold text-muted hover:text-white transition-all text-sm disabled:opacity-50"
                >
                  Cancel
                </button>
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

      {/* Processing Loader Overlay */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass p-8 rounded-[2rem] max-w-sm w-full flex flex-col items-center text-center space-y-6"
            >
              <div className="relative w-16 h-16 flex items-center justify-center">
                <span className="absolute inset-0 rounded-full border-4 border-accent/20"></span>
                <span className="absolute inset-0 rounded-full border-4 border-accent border-t-transparent animate-spin"></span>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">Processing Payment</h3>
                <p className="text-xs text-muted leading-relaxed">
                  Please wait... Payment is being processed. The WhatsApp text will be sent within the next 5 minutes.
                </p>
              </div>
            </motion.div>
          </motion.div>
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

      {/* Service Configuration Modal */}
      <AnimatePresence>
        {activeConfigCartId && activeConfigItem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveConfigCartId(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg glass rounded-[2.5rem] p-8 space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold">{activeConfigItem.name}</h3>
                  <p className="text-xs text-muted">Configure staff assignment and item discount</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-accent">Base: ₹{activeConfigItem.price}</p>
                  <p className="text-xs font-semibold text-green-400">Final: ₹{getItemFinalPrice(activeConfigItem)}</p>
                </div>
              </div>

              {/* Discount Section */}
              <div className="bg-background/40 p-5 rounded-3xl border border-border/30 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white">Item Discount</span>
                  <div className="flex bg-surface p-1 rounded-xl border border-border gap-1">
                    <button 
                      type="button"
                      onClick={() => {
                        setCart(prev => prev.map(item => 
                          item.cartId === activeConfigCartId 
                            ? { ...item, discountType: item.discountType === 'percent' ? 'none' : 'percent', discountValue: 0 }
                            : item
                        ));
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        activeConfigItem.discountType === 'percent' 
                          ? 'bg-accent text-white' 
                          : 'text-muted hover:text-white'
                      }`}
                    >
                      Percent (%)
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                        setCart(prev => prev.map(item => 
                          item.cartId === activeConfigCartId 
                            ? { ...item, discountType: item.discountType === 'fixed' ? 'none' : 'fixed', discountValue: 0 }
                            : item
                        ));
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        activeConfigItem.discountType === 'fixed' 
                          ? 'bg-accent text-white' 
                          : 'text-muted hover:text-white'
                      }`}
                    >
                      Fixed (₹)
                    </button>
                  </div>
                </div>

                {activeConfigItem.discountType !== 'none' && (
                  <div className="flex items-center gap-4">
                    <div className="relative flex-1">
                      <input 
                        type="number" 
                        placeholder={activeConfigItem.discountType === 'percent' ? 'Enter percentage...' : 'Enter rupees...'}
                        value={activeConfigItem.discountValue || ''}
                        onChange={(e) => {
                          const val = Math.max(0, Number(e.target.value));
                          setCart(prev => prev.map(item => 
                            item.cartId === activeConfigCartId 
                              ? { ...item, discountValue: val }
                              : item
                          ));
                        }}
                        className="w-full bg-surface border border-border rounded-xl py-3 px-4 focus:outline-none focus:border-accent/50 text-sm"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-muted">
                        {activeConfigItem.discountType === 'percent' ? '%' : '₹'}
                      </span>
                    </div>
                    {getItemDiscount(activeConfigItem) > 0 && (
                      <span className="text-sm font-bold text-red-500 shrink-0">
                        -₹{getItemDiscount(activeConfigItem)}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Regular Service Staff Assignment */}
              {!activeConfigItem.isPackage && (
                <div className="bg-background/40 p-5 rounded-3xl border border-border/30 space-y-3">
                  <p className="text-sm font-bold text-white">Assigned Stylists</p>
                  
                  {staff.length > 0 ? (
                    <div className="space-y-3">
                      {/* Selected Staff Badges */}
                      {(activeConfigItem.staffIds || []).length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {(activeConfigItem.staffIds || []).map((id: string) => {
                            const s = staff.find(member => member.id === id);
                            if (!s) return null;
                            return (
                              <span 
                                key={id}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent/15 text-accent rounded-full text-xs font-semibold border border-accent/25"
                              >
                                {s.name} ({s.role})
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newStaffIds = (activeConfigItem.staffIds || []).filter((sid: string) => sid !== id);
                                    setCart(prev => prev.map(cartItem => 
                                      cartItem.cartId === activeConfigCartId 
                                        ? { ...cartItem, staffIds: newStaffIds }
                                        : cartItem
                                    ));
                                  }}
                                  className="hover:text-red-500 transition-colors ml-1 font-bold text-sm"
                                  title="Remove staff"
                                >
                                  &times;
                                </button>
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-muted italic">No stylists assigned yet. Please select at least one.</p>
                      )}
                      
                      {/* Dropdown Selector */}
                      <select
                        value=""
                        onChange={(e) => {
                          const val = e.target.value;
                          if (!val) return;
                          const assignedIds = activeConfigItem.staffIds || [];
                          const newStaffIds = assignedIds.includes(val)
                            ? assignedIds
                            : [...assignedIds, val];
                          setCart(prev => prev.map(cartItem => 
                            cartItem.cartId === activeConfigCartId 
                              ? { ...cartItem, staffIds: newStaffIds }
                              : cartItem
                          ));
                        }}
                        className="w-full bg-surface border border-border rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-accent/50 transition-all text-white"
                      >
                        <option value="" className="bg-surface text-muted">Select contributing staff...</option>
                        {staff.map(member => (
                          <option key={member.id} value={member.id} className="bg-surface text-white">
                            {member.name} ({member.role})
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <p className="text-xs text-muted italic">No staff found. Please add staff in the Staff Tracking tab.</p>
                  )}
                </div>
              )}

              {/* Package Sub-Services Staff Assignment */}
              {activeConfigItem.isPackage && activeConfigItem.packageServices && (
                <div className="space-y-4">
                  <p className="text-sm font-bold text-white">Package Services Staff Assignment</p>
                  
                  <div className="space-y-3 max-h-[30vh] overflow-y-auto pr-1 custom-scrollbar">
                    {activeConfigItem.packageServices.map((sub: any) => {
                      const assignedIds = activeConfigItem.packageStaff?.[sub.name] || [];
                      const numServices = activeConfigItem.packageServices.length;
                      const subServicePrice = Math.round(getItemFinalPrice(activeConfigItem) / numServices);
                      
                      return (
                        <div key={sub.name} className="bg-background/40 p-4 rounded-2xl border border-border/30 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-white">{sub.name}</span>
                            <span className="text-[10px] text-muted font-bold">Valued at: ₹{subServicePrice}</span>
                          </div>
                          
                          {staff.length > 0 ? (
                            <div className="space-y-2">
                              {/* Selected Staff Badges */}
                              {assignedIds.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                  {assignedIds.map((id: string) => {
                                    const s = staff.find(member => member.id === id);
                                    if (!s) return null;
                                    return (
                                      <span 
                                        key={id}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-accent/15 text-accent rounded-full text-[10px] font-semibold border border-accent/25"
                                      >
                                        {s.name}
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const newStaffIds = assignedIds.filter((sid: string) => sid !== id);
                                            setCart(prev => prev.map(cartItem => 
                                              cartItem.cartId === activeConfigCartId 
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
                                          className="hover:text-red-500 transition-colors ml-1 font-bold text-xs"
                                          title="Remove staff"
                                        >
                                          &times;
                                        </button>
                                      </span>
                                    );
                                  })}
                                </div>
                              )}
                              
                              {/* Dropdown Selector */}
                              <select
                                value=""
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (!val) return;
                                  const newStaffIds = assignedIds.includes(val)
                                    ? assignedIds
                                    : [...assignedIds, val];
                                  setCart(prev => prev.map(cartItem => 
                                    cartItem.cartId === activeConfigCartId 
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
                                className="w-full bg-surface border border-border rounded-xl py-2 px-3 text-xs focus:outline-none focus:border-accent/50 transition-all text-white"
                              >
                                <option value="" className="bg-surface text-muted">Select contributing staff...</option>
                                {staff.map(member => (
                                  <option key={member.id} value={member.id} className="bg-surface text-white">
                                    {member.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          ) : (
                            <p className="text-[10px] text-muted italic">No staff found.</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-4 border-t border-border/30">
                <button 
                  type="button"
                  onClick={() => {
                    // Quick validation before close
                    if (!activeConfigItem.isPackage && (activeConfigItem.staffIds || []).length === 0) {
                      alert('Please assign at least one staff member before saving.');
                      return;
                    }
                    if (activeConfigItem.isPackage && activeConfigItem.packageServices) {
                      for (const sub of activeConfigItem.packageServices) {
                        const assigned = activeConfigItem.packageStaff?.[sub.name] || [];
                        if (assigned.length === 0) {
                          alert(`Please assign at least one staff member to the ${sub.name} service.`);
                          return;
                        }
                      }
                    }
                    setActiveConfigCartId(null);
                  }}
                  className="flex-1 bg-accent text-white py-3 rounded-xl font-bold hover:opacity-90 transition-all"
                >
                  Apply & Close
                </button>
              </div>
            </motion.div>
          </div>
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
