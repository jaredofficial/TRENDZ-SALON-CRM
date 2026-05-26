import React, { useState, useEffect } from 'react';
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
  QrCode
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import { services, customers } from '../data/mockData';

export default function POS({ branchId }: { branchId: string }) {
  const [cart, setCart] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [discountType, setDiscountType] = useState<'none' | 'fixed' | 'percent'>('none');
  const [discountValue, setDiscountValue] = useState(0);
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customersList, setCustomersList] = useState<any[]>(customers.filter(c => c.branchId === branchId));
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '' });
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [redeemedPoints, setRedeemedPoints] = useState(0);
  const [showQRModal, setShowQRModal] = useState(false);
  const [visitStatus, setVisitStatus] = useState('');

  useEffect(() => {
    setCustomersList(customers.filter(c => c.branchId === branchId));
  }, [branchId]);

  const [serviceSearch, setServiceSearch] = useState('');

  const branchServices = services.filter(s => s.branchId === branchId);
  const categories = ['All', ...new Set(branchServices.map(s => s.category))];

  const addToCart = (service: any) => {
    setCart([...cart, { ...service, cartId: Math.random().toString(36).substr(2, 9) }]);
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

  const filteredCustomers = customersList.filter(c => 
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) || 
    c.phone.includes(customerSearch)
  );

  const finalizePayment = async () => {
    // Trigger MSG91 WhatsApp Automation
    if (selectedCustomer) {
      try {
        await fetch('/api/automation/trigger', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'payment_received',
            customer: selectedCustomer,
            template_id: 'appointment_confirmed_wa_text_v1', 
            variables: [
              "Aion Salon", 
              total.toString(), 
              new Date().toLocaleDateString()
            ]
          })
        });
      } catch (e) {
        console.error('Failed to trigger WhatsApp automation:', e);
      }
    }

    const simulateVisit = async (name: string) => {
      setVisitStatus(`Processing visit for ${name}...`);
      
      // Trigger WhatsApp Automation via MSG91
      try {
        await fetch('/api/automation/trigger', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'appointment_confirmed',
            customer: { name, phone: '917439784129' }, // Using your number for demo testing
            template_id: 'appointment_confirmed_wa_text_v1'
          })
        });
        setVisitStatus(`Successfully confirmed appointment for ${name}!`);
      } catch (e) {
        setVisitStatus(`Visit recorded for ${name}`);
      }

      setTimeout(() => {
        setVisitStatus('');
      }, 3000);
    };

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
      className="h-full flex gap-8 pb-8"
    >
      {/* Services Grid */}
      <div className="flex-1 space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === cat 
                    ? 'bg-accent text-black' 
                    : 'bg-surface border border-border text-muted hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={16} />
            <input 
              type="text" 
              value={serviceSearch}
              onChange={(e) => setServiceSearch(e.target.value)}
              placeholder="Search services..." 
              className="w-full bg-surface/50 border border-border rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-accent/50 transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 overflow-y-auto custom-scrollbar pb-8">
          {branchServices
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
                  <div className="p-3 bg-surface rounded-2xl text-accent group-hover:bg-accent group-hover:text-black transition-all">
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
      <div className="w-[400px] glass rounded-[2.5rem] flex flex-col overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-border">
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
                  className="p-2 bg-surface border border-border rounded-xl text-accent hover:bg-accent hover:text-black transition-all"
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
                      <span className="text-[10px] bg-accent/10 text-accent px-2 py-1 rounded-full">{c.points} pts</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-accent/10 border border-accent/20 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-black font-bold">
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
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          <AnimatePresence>
            {cart.map((item) => (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                key={item.cartId}
                className="flex items-center justify-between p-4 bg-surface rounded-2xl border border-border group"
              >
                <div>
                  <p className="font-bold text-sm">{item.name}</p>
                  <p className="text-xs text-accent">₹{item.price}</p>
                </div>
                <button 
                  onClick={() => removeFromCart(item.cartId)}
                  className="p-2 text-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 size={18} />
                </button>
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

        <div className="p-6 bg-surface border-t border-border space-y-4">
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
                    className={`p-1.5 rounded-lg border transition-all ${discountType === 'percent' ? 'bg-accent border-accent text-black' : 'border-border text-muted'}`}
                  >
                    <Percent size={14} />
                  </button>
                  <button 
                    onClick={() => setDiscountType(discountType === 'fixed' ? 'none' : 'fixed')}
                    className={`p-1.5 rounded-lg border transition-all ${discountType === 'fixed' ? 'bg-accent border-accent text-black' : 'border-border text-muted'}`}
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
            onClick={() => setIsCheckoutOpen(true)}
            className="w-full bg-accent text-accent-foreground py-4 rounded-2xl font-bold text-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-accent/20"
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

              <div className="grid grid-cols-2 gap-4">
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
                <PaymentMethod 
                  icon={Star} 
                  label="Points" 
                  selected={selectedPaymentMethod === 'Points'} 
                  onClick={() => setSelectedPaymentMethod('Points')} 
                />
              </div>

              <div className="space-y-4">
                <button 
                  onClick={handleCompletePayment}
                  className="w-full bg-accent text-black py-4 rounded-2xl font-bold text-lg hover:opacity-90 transition-all"
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

              {/* QR Code Placeholder Box */}
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
                    const customer = { ...newCustomer, id: Math.random().toString(), points: 0 };
                    setCustomersList([...customersList, customer]);
                    setSelectedCustomer(customer);
                    setShowCustomerForm(false);
                    setNewCustomer({ name: '', phone: '' });
                  }}
                  className="flex-1 bg-accent text-black py-3 rounded-xl font-bold hover:opacity-90 transition-all"
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
              <div className="w-24 h-24 bg-accent rounded-full flex items-center justify-center text-black">
                <CheckCircle2 size={48} />
              </div>
              <div>
                <h2 className="text-3xl font-bold">Payment Successful</h2>
                <p className="text-muted mt-2">Transaction ID: #AION-88291</p>
              </div>
              <button className="bg-white text-black px-8 py-3 rounded-full font-bold">
                Print Receipt
              </button>
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
