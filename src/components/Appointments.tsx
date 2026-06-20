import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Calendar as CalendarIcon, 
  List, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  User, 
  Scissors, 
  Phone, 
  CalendarDays,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Appointment } from '../types';
import { supabase } from '../lib/supabase';

interface AppointmentsProps {
  appointments: Appointment[];
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
  clients?: any[];
  services?: any[];
}

export default function Appointments({ appointments, setAppointments, clients = [], services = [] }: AppointmentsProps) {
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  
  // Modals state
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [reschedulingAppt, setReschedulingAppt] = useState<Appointment | null>(null);
  
  // Book Form State
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [customPhone, setCustomPhone] = useState('+91');
  const [bookDate, setBookDate] = useState('');
  const [bookTime, setBookTime] = useState('10:00 AM');
  const [selectedServices, setSelectedServices] = useState<string[]>(['1']);

  // Reschedule Form State
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('10:00 AM');

  // Disable background scrolling when modal is open
  useEffect(() => {
    if (isBookModalOpen || reschedulingAppt) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isBookModalOpen, reschedulingAppt]);

  // Filter clients based on search input
  const filteredCustomers = clientSearch
    ? clients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase()))
    : [];

  // Calendar calculations
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const result = [];
    
    // First day of month offset
    const firstDayIndex = new Date(year, month, 1).getDay();
    
    // Previous month trailing days
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      result.push({
        date: new Date(year, month - 1, prevMonthDays - i),
        isCurrentMonth: false
      });
    }
    
    // Current month days
    for (let i = 1; i <= days; i++) {
      result.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      });
    }
    
    // Next month leading days
    const remainingSlots = 42 - result.length; // 6 rows of 7 days
    for (let i = 1; i <= remainingSlots; i++) {
      result.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      });
    }
    
    return result;
  };

  const days = getDaysInMonth(currentMonth);

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleDayClick = (dayDate: Date) => {
    setSelectedDate(dayDate);
  };

  const formatDateString = (date: Date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const getAppointmentsForDate = (date: Date) => {
    const dateStr = formatDateString(date);
    return appointments.filter(appt => appt.date === dateStr);
  };

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientSearch && !selectedClient) return;

    const selectedServiceObjs = selectedServices.map(id => services.find(s => s.id === id)).filter(Boolean) as any[];
    const serviceNames = selectedServiceObjs.map(s => s.name).join(', ');
    const totalPrice = selectedServiceObjs.reduce((sum, s) => sum + s.price, 0);

    const formatPhoneNumber = (ph: string) => {
      const trimmed = ph.trim();
      if (!trimmed) return '+91';
      const digits = trimmed.replace(/[\s-()]/g, '');
      if (/^\d{10}$/.test(digits)) return `+91${digits}`;
      if (/^91\d{10}$/.test(digits)) return `+${digits}`;
      if (/^\d+$/.test(digits)) return `+91${digits}`;
      return trimmed;
    };
    const clientName = selectedClient ? selectedClient.name : clientSearch;
    const clientPhone = selectedClient ? selectedClient.phone : customPhone;
    const formattedPhone = formatPhoneNumber(clientPhone);
    const finalPhone = formattedPhone || '+91 99999 99999';
    const finalDate = bookDate || formatDateString(new Date());

    const newAppt: Appointment = {
      id: Math.random().toString(36).substring(2, 9),
      clientName,
      phone: finalPhone,
      date: finalDate,
      time: bookTime,
      service: serviceNames,
      status: 'booked',
      price: totalPrice
    };

    // Save appointment to Supabase
    supabase.from('appointments').upsert({
      id: newAppt.id,
      client_name: newAppt.clientName,
      phone: newAppt.phone,
      service: newAppt.service,
      date: newAppt.date,
      time: newAppt.time,
      status: newAppt.status
    }).then(({ error }) => {
      if (error) console.error("Failed to sync new appointment to Supabase:", error);
    });

    setAppointments(prev => [newAppt, ...prev]);

    // 1. Trigger Booking Confirmation WhatsApp
    try {
      await fetch('/api/automation/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'appointment_confirmed',
          customer: { name: clientName, phone: finalPhone },
          template_id: 'appointment_confirmed_wa_text_v1',
          variables: [
            `${finalDate} at ${bookTime}`,
            serviceNames,
            finalPhone
          ]
        })
      });
    } catch (err) {
      console.error('Failed to send booking confirmation WhatsApp:', err);
    }

    // 2. Trigger Booking Reminder WhatsApp (calculated 5m before, fallback to 10s for testing)
    try {
      await fetch('/api/automation/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'appointment_reminder',
          customer: { name: clientName, phone: finalPhone },
          template_id: 'appointment_reminder_text',
          appointmentDate: finalDate,
          appointmentTime: bookTime,
          variables: [
            finalDate,
            bookTime
          ]
        })
      });
    } catch (err) {
      console.error('Failed to schedule appointment reminder WhatsApp:', err);
    }
    
    // Reset Form
    setClientSearch('');
    setSelectedClient(null);
    setCustomPhone('+91');
    setBookDate('');
    setBookTime('10:00 AM');
    setSelectedServices(['1']);
    setIsBookModalOpen(false);
  };

  const handleReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reschedulingAppt) return;

    // Sync rescheduled appointment to Supabase
    supabase.from('appointments').upsert({
      id: reschedulingAppt.id,
      client_name: reschedulingAppt.clientName,
      phone: reschedulingAppt.phone,
      service: reschedulingAppt.service,
      date: rescheduleDate,
      time: rescheduleTime,
      status: 'rescheduled'
    }).then(({ error }) => {
      if (error) console.error("Failed to sync rescheduled appointment to Supabase:", error);
    });

    setAppointments(prev => 
      prev.map(appt => 
        appt.id === reschedulingAppt.id 
          ? { ...appt, date: rescheduleDate, time: rescheduleTime, status: 'rescheduled' } 
          : appt
      )
    );

    // Trigger Reschedule confirmation WhatsApp
    try {
      await fetch('/api/automation/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'appointment_rescheduled',
          customer: { name: reschedulingAppt.clientName, phone: reschedulingAppt.phone },
          template_id: 'appointment_reschedule_text',
          variables: [
            reschedulingAppt.service,
            rescheduleDate,
            rescheduleTime
          ]
        })
      });
    } catch (err) {
      console.error('Failed to send reschedule confirmation WhatsApp:', err);
    }

    setReschedulingAppt(null);
  };

  const handleCancelAppointment = (id: string) => {
    if (confirm("Are you sure you want to cancel this appointment?")) {
      const foundAppt = appointments.find(appt => appt.id === id);
      if (foundAppt) {
        supabase.from('appointments').upsert({
          id: foundAppt.id,
          client_name: foundAppt.clientName,
          phone: foundAppt.phone,
          service: foundAppt.service,
          date: foundAppt.date,
          time: foundAppt.time,
          status: 'cancelled'
        }).then(({ error }) => {
          if (error) console.error("Failed to sync cancelled appointment to Supabase:", error);
        });
      }

      setAppointments(prev => 
        prev.map(appt => 
          appt.id === id ? { ...appt, status: 'cancelled' } : appt
        )
      );
    }
  };

  const sortedAppointments = [...appointments].sort((a, b) => {
    return new Date(`${a.date} ${a.time}`).getTime() - new Date(`${b.date} ${b.time}`).getTime();
  });

  const getGroupedAppointments = () => {
    const todayStr = formatDateString(new Date());
    const todayList: Appointment[] = [];
    const upcomingList: Appointment[] = [];
    const pastList: Appointment[] = [];

    sortedAppointments.forEach(appt => {
      if (appt.date === todayStr) {
        todayList.push(appt);
      } else if (appt.date > todayStr) {
        upcomingList.push(appt);
      } else {
        pastList.push(appt);
      }
    });

    return { todayList, upcomingList, pastList };
  };

  const { todayList, upcomingList, pastList } = getGroupedAppointments();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'rescheduled': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'cancelled': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-accent/10 text-accent border-accent/20';
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Appointments</h1>
          <p className="text-muted">Manage and schedule client bookings</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* View Switcher */}
          <div className="bg-surface p-1 rounded-xl border border-border flex">
            <button
              onClick={() => setViewMode('calendar')}
              className={`p-2 rounded-lg transition-all flex items-center gap-2 text-sm font-medium ${
                viewMode === 'calendar' ? 'bg-accent text-black' : 'text-muted hover:text-white'
              }`}
            >
              <CalendarIcon size={16} />
              <span>Calendar</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all flex items-center gap-2 text-sm font-medium ${
                viewMode === 'list' ? 'bg-accent text-black' : 'text-muted hover:text-white'
              }`}
            >
              <List size={16} />
              <span>List View</span>
            </button>
          </div>

          {/* Book Appointment Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              setBookDate(formatDateString(selectedDate));
              setIsBookModalOpen(true);
            }}
            className="bg-accent text-accent-foreground font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-accent/20 hover:opacity-90 transition-all flex items-center gap-2 text-sm"
          >
            <Plus size={18} />
            <span>Book Appointment</span>
          </motion.button>
        </div>
      </div>

      {/* Main Layout Area */}
      {viewMode === 'calendar' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar Grid */}
          <div className="lg:col-span-2 glass rounded-[2rem] p-4 md:p-6 space-y-6">
            {/* Calendar Header */}
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg md:text-xl">
                {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </h3>
              <div className="flex gap-2">
                <button 
                  onClick={prevMonth}
                  className="p-2 bg-surface border border-border rounded-xl text-muted hover:text-white hover:bg-surface-hover transition-all"
                >
                  <ChevronLeft size={18} />
                </button>
                <button 
                  onClick={nextMonth}
                  className="p-2 bg-surface border border-border rounded-xl text-muted hover:text-white hover:bg-surface-hover transition-all"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            {/* Days of Week */}
            <div className="grid grid-cols-7 text-center text-xs font-bold uppercase tracking-widest text-muted pb-2 border-b border-border">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="py-2">{d}</div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1 md:gap-2">
              {days.map((day, idx) => {
                const dayAppts = getAppointmentsForDate(day.date);
                const isSelected = formatDateString(day.date) === formatDateString(selectedDate);
                const isToday = formatDateString(day.date) === formatDateString(new Date());

                return (
                  <button
                    key={idx}
                    onClick={() => handleDayClick(day.date)}
                    className={`aspect-square rounded-xl md:rounded-2xl p-1 md:p-2 flex flex-col justify-between items-center transition-all relative border ${
                      isSelected 
                        ? 'bg-accent border-accent text-black font-bold' 
                        : day.isCurrentMonth
                          ? isToday
                            ? 'bg-accent/10 border-accent/30 text-accent font-bold'
                            : 'bg-surface border-border text-white hover:bg-surface-hover hover:border-accent/20'
                          : 'bg-surface/30 border-transparent text-muted/40 hover:bg-surface/50'
                    }`}
                  >
                    <span className="text-xs md:text-sm self-start">{day.date.getDate()}</span>
                    
                    {/* Appointment dots indicator */}
                    {dayAppts.length > 0 && (
                      <div className="flex gap-0.5 md:gap-1 justify-center w-full mt-auto">
                        {dayAppts.slice(0, 3).map((appt) => (
                          <span 
                            key={appt.id} 
                            className={`w-1 md:w-1.5 h-1 md:h-1.5 rounded-full ${
                              isSelected ? 'bg-black' : appt.status === 'cancelled' ? 'bg-red-500' : 'bg-accent'
                            }`}
                          />
                        ))}
                        {dayAppts.length > 3 && (
                          <span className={`text-[6px] md:text-[8px] font-bold ${isSelected ? 'text-black' : 'text-accent'}`}>+</span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bookings for Selected Date Sidebar */}
          <div className="glass rounded-[2rem] p-6 space-y-6 flex flex-col h-full min-h-[450px]">
            <div className="border-b border-border pb-4">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <CalendarDays className="text-accent" size={20} />
                <span>Bookings for {selectedDate.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-1 max-h-[450px]">
              {getAppointmentsForDate(selectedDate).length > 0 ? (
                getAppointmentsForDate(selectedDate).map((appt) => (
                  <div key={appt.id} className="bg-surface border border-border p-4 rounded-2xl relative group hover:border-accent/30 transition-all">
                    <span className={`absolute top-4 right-4 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border ${getStatusColor(appt.status)}`}>
                      {appt.status}
                    </span>
                    <div className="space-y-3">
                      <div>
                        <p className="font-bold text-sm text-white">{appt.clientName}</p>
                        <p className="text-[10px] text-muted flex items-center gap-1 mt-1">
                          <Phone size={10} />
                          {appt.phone}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted">
                        <span className="flex items-center gap-1">
                          <Clock size={12} className="text-accent" />
                          {appt.time}
                        </span>
                        <span className="flex items-center gap-1">
                          <Scissors size={12} className="text-accent" />
                          {appt.service}
                        </span>
                      </div>
                      
                      {appt.status !== 'cancelled' && (
                        <div className="flex gap-2 pt-2 border-t border-border mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              setRescheduleDate(appt.date);
                              setRescheduleTime(appt.time);
                              setReschedulingAppt(appt);
                            }}
                            className="text-xs font-bold text-accent hover:underline flex-1 py-1 text-center bg-surface-hover border border-border rounded-lg"
                          >
                            Reschedule
                          </button>
                          <button
                            onClick={() => handleCancelAppointment(appt.id)}
                            className="text-xs font-bold text-red-500 hover:underline flex-1 py-1 text-center bg-surface-hover border border-border rounded-lg"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center text-muted p-8 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center text-muted/60">
                    <CalendarDays size={20} />
                  </div>
                  <div>
                    <p className="font-semibold text-white">No Bookings</p>
                    <p className="text-xs mt-1">No appointments scheduled for this date.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* List View */
        <div className="space-y-8">
          {/* Today's Bookings */}
          <div className="space-y-4">
            <h3 className="font-bold text-lg uppercase tracking-wider text-accent border-l-2 border-accent pl-3">Today</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {todayList.length > 0 ? (
                todayList.map(appt => (
                  <AppointmentCard 
                    key={appt.id} 
                    appt={appt} 
                    onReschedule={() => {
                      setRescheduleDate(appt.date);
                      setRescheduleTime(appt.time);
                      setReschedulingAppt(appt);
                    }}
                    onCancel={() => handleCancelAppointment(appt.id)}
                    statusColor={getStatusColor(appt.status)}
                  />
                ))
              ) : (
                <p className="text-muted text-sm italic pl-3">No appointments scheduled for today.</p>
              )}
            </div>
          </div>

          {/* Upcoming Bookings */}
          <div className="space-y-4">
            <h3 className="font-bold text-lg uppercase tracking-wider text-muted border-l-2 border-border pl-3">Upcoming</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingList.length > 0 ? (
                upcomingList.map(appt => (
                  <AppointmentCard 
                    key={appt.id} 
                    appt={appt} 
                    onReschedule={() => {
                      setRescheduleDate(appt.date);
                      setRescheduleTime(appt.time);
                      setReschedulingAppt(appt);
                    }}
                    onCancel={() => handleCancelAppointment(appt.id)}
                    statusColor={getStatusColor(appt.status)}
                  />
                ))
              ) : (
                <p className="text-muted text-sm italic pl-3">No upcoming appointments.</p>
              )}
            </div>
          </div>

          {/* Past Bookings */}
          <div className="space-y-4">
            <h3 className="font-bold text-lg uppercase tracking-wider text-muted/50 border-l-2 border-border/30 pl-3">Past</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-60">
              {pastList.length > 0 ? (
                pastList.map(appt => (
                  <AppointmentCard 
                    key={appt.id} 
                    appt={appt} 
                    onReschedule={() => {
                      setRescheduleDate(appt.date);
                      setRescheduleTime(appt.time);
                      setReschedulingAppt(appt);
                    }}
                    onCancel={() => handleCancelAppointment(appt.id)}
                    statusColor={getStatusColor(appt.status)}
                    hideActions={true}
                  />
                ))
              ) : (
                <p className="text-muted text-sm italic pl-3">No past records.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modals using React Portal to prevent layout breaks caused by parent transforms */}
      {createPortal(
        <AnimatePresence>
          {isBookModalOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[120] overflow-y-auto"
            >
              {/* Backdrop */}
              <div 
                onClick={() => {
                  setIsBookModalOpen(false);
                  setClientSearch('');
                  setSelectedClient(null);
                  setCustomPhone('');
                  setSelectedServices(['1']);
                }}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm cursor-pointer"
              />
              
              {/* Scrollable Container */}
              <div className="flex min-h-full items-center justify-center p-4 sm:p-6 pointer-events-none relative z-10">
                <motion.div 
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.9, y: 20 }}
                  transition={{ ease: "easeOut", duration: 0.2 }}
                  onClick={(e) => e.stopPropagation()}
                  className="relative w-full max-w-md bg-surface border border-border/50 rounded-[2.5rem] p-8 space-y-6 shadow-2xl pointer-events-auto my-8"
                >
                  <h3 className="text-2xl font-bold">Book Appointment</h3>
                  
                  <form onSubmit={handleBookAppointment} className="space-y-4">
                    {/* Client Search with Autocomplete */}
                    <div className="space-y-2 relative">
                      <label className="text-xs font-bold uppercase tracking-widest text-muted block">Client Name</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={16} />
                        <input 
                          type="text" 
                          placeholder="Search or enter client..."
                          value={clientSearch}
                          onChange={(e) => {
                            setClientSearch(e.target.value);
                            if (selectedClient && selectedClient.name !== e.target.value) {
                              setSelectedClient(null);
                            }
                          }}
                          className="w-full bg-surface border border-border rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-accent/50 text-sm"
                          required
                        />
                      </div>
                      
                      {/* Suggestions list */}
                      {clientSearch && !selectedClient && filteredCustomers.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-surface border border-border rounded-xl shadow-2xl z-[150] overflow-hidden max-h-40 overflow-y-auto">
                          {filteredCustomers.map(c => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => {
                                setSelectedClient(c);
                                setClientSearch(c.name);
                                setCustomPhone(c.phone);
                              }}
                              className="w-full p-3 text-left hover:bg-white/5 transition-all text-sm border-b border-border/50 last:border-b-0 flex items-center justify-between"
                            >
                              <span className="font-semibold">{c.name}</span>
                              <span className="text-xs text-muted">{c.phone}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Client Phone Number */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-muted block">Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={16} />
                        <input 
                          type="text" 
                          placeholder="+91..."
                          value={selectedClient ? selectedClient.phone : customPhone}
                          onChange={(e) => !selectedClient && setCustomPhone(e.target.value)}
                          disabled={!!selectedClient}
                          className="w-full bg-surface border border-border rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-accent/50 text-sm disabled:opacity-50"
                          required
                        />
                      </div>
                    </div>

                    {/* Date & Time Picker */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted block">Date</label>
                        <input 
                          type="date"
                          value={bookDate}
                          onChange={(e) => setBookDate(e.target.value)}
                          className="w-full bg-surface border border-border rounded-xl py-3 px-4 focus:outline-none focus:border-accent/50 text-sm [color-scheme:dark]"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted block">Time</label>
                        <select
                          value={bookTime}
                          onChange={(e) => setBookTime(e.target.value)}
                          className="w-full bg-surface border border-border rounded-xl py-3 px-4 focus:outline-none focus:border-accent/50 text-sm appearance-none"
                        >
                          {['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM'].map(t => (
                            <option key={t} value={t} className="bg-surface text-white">{t}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Service Selection (Add One-by-One) */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold uppercase tracking-widest text-muted">Services</label>
                        {selectedServices.length < services.length && (
                          <button
                            type="button"
                            onClick={() => {
                              const nextAvailable = services.find(s => !selectedServices.includes(s.id));
                              if (nextAvailable) {
                                setSelectedServices(prev => [...prev, nextAvailable.id]);
                              }
                            }}
                            className="text-xs font-bold text-accent hover:underline flex items-center gap-1"
                          >
                            <Plus size={14} /> Add Service
                          </button>
                        )}
                      </div>
                      
                      <div className="space-y-3 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                        {selectedServices.map((serviceId, index) => (
                          <div key={index} className="flex gap-2 items-center">
                            <select
                              value={serviceId}
                              onChange={(e) => {
                                const val = e.target.value;
                                setSelectedServices(prev => prev.map((s, idx) => idx === index ? val : s));
                              }}
                              className="flex-1 bg-surface border border-border rounded-xl py-2.5 px-4 focus:outline-none focus:border-accent/50 text-sm"
                            >
                              {services
                                .filter(s => s.id === serviceId || !selectedServices.includes(s.id))
                                .map(s => (
                                  <option key={s.id} value={s.id} className="bg-surface text-white">
                                    {s.name} (₹{s.price})
                                  </option>
                                ))}
                            </select>
                            
                            {selectedServices.length > 1 && (
                              <button
                                type="button"
                                onClick={() => setSelectedServices(prev => prev.filter((_, idx) => idx !== index))}
                                  className="p-2.5 bg-surface-hover hover:bg-red-500/10 border border-border hover:border-red-500/30 text-muted hover:text-red-500 rounded-xl transition-all"
                              >
                                <XCircle size={16} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Total Price Display */}
                    <div className="flex justify-between items-center bg-surface border border-border rounded-xl p-3 text-sm">
                      <span className="text-muted font-medium">Total Price:</span>
                      <span className="text-accent font-bold text-base">
                        ₹{selectedServices.reduce((sum, id) => {
                          const s = services.find(srv => srv.id === id);
                          return sum + (s?.price || 0);
                        }, 0)}
                      </span>
                    </div>

                    <div className="flex gap-4 pt-4">
                      <button
                        type="submit"
                        className="flex-1 bg-accent text-black font-bold py-3 rounded-xl hover:opacity-95 transition-all text-sm"
                      >
                        Confirm Booking
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsBookModalOpen(false);
                          setClientSearch('');
                          setSelectedClient(null);
                          setCustomPhone('');
                          setSelectedServices(['1']);
                        }}
                        className="flex-1 py-3 text-muted hover:text-white transition-all text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Reschedule Modal using React Portal */}
      {createPortal(
        <AnimatePresence>
          {reschedulingAppt && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[120] overflow-y-auto"
            >
              {/* Backdrop */}
              <div 
                onClick={() => setReschedulingAppt(null)}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm cursor-pointer"
              />
              
              {/* Scrollable Container */}
              <div className="flex min-h-full items-center justify-center p-4 sm:p-6 pointer-events-none relative z-10">
                <motion.div 
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.9, y: 20 }}
                  transition={{ ease: "easeOut", duration: 0.2 }}
                  onClick={(e) => e.stopPropagation()}
                  className="relative w-full max-w-sm bg-surface border border-border/50 rounded-[2rem] p-8 space-y-6 shadow-2xl pointer-events-auto my-8"
                >
                  <div>
                    <h3 className="text-2xl font-bold">Reschedule Appointment</h3>
                    <p className="text-xs text-muted mt-1">For {reschedulingAppt.clientName} ({reschedulingAppt.service})</p>
                  </div>

                  <form onSubmit={handleReschedule} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-muted block">New Date</label>
                      <input 
                        type="date"
                        value={rescheduleDate}
                        onChange={(e) => setRescheduleDate(e.target.value)}
                        className="w-full bg-surface border border-border rounded-xl py-3 px-4 focus:outline-none focus:border-accent/50 text-sm [color-scheme:dark]"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-muted block">New Time</label>
                      <select
                        value={rescheduleTime}
                        onChange={(e) => setRescheduleTime(e.target.value)}
                        className="w-full bg-surface border border-border rounded-xl py-3 px-4 focus:outline-none focus:border-accent/50 text-sm"
                      >
                        {['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM'].map(t => (
                          <option key={t} value={t} className="bg-surface text-white">{t}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex gap-4 pt-4">
                      <button
                        type="submit"
                        className="flex-1 bg-accent text-black font-bold py-3 rounded-xl hover:opacity-95 transition-all text-sm"
                      >
                        Update Booking
                      </button>
                      <button
                        type="button"
                        onClick={() => setReschedulingAppt(null)}
                        className="flex-1 py-3 text-muted hover:text-white transition-all text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}

interface AppointmentCardProps {
  key?: string;
  appt: Appointment;
  onReschedule: () => void;
  onCancel: () => void;
  statusColor: string;
  hideActions?: boolean;
}

function AppointmentCard({ appt, onReschedule, onCancel, statusColor, hideActions = false }: AppointmentCardProps) {
  return (
    <div className="glass p-6 rounded-[2rem] hover:border-accent/30 transition-all duration-300 relative group flex flex-col justify-between">
      <span className={`absolute top-6 right-6 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusColor}`}>
        {appt.status}
      </span>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-surface rounded-xl flex items-center justify-center text-accent font-bold">
            {appt.clientName.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <h4 className="font-bold text-sm text-white">{appt.clientName}</h4>
            <p className="text-[10px] text-muted flex items-center gap-1 mt-0.5">
              <Phone size={10} />
              {appt.phone}
            </p>
          </div>
        </div>

        <div className="space-y-2 border-t border-border/50 pt-3">
          <p className="text-xs text-muted flex items-center gap-2">
            <Clock size={12} className="text-accent" />
            <span className="font-medium text-white">{appt.time}</span>
            <span>•</span>
            <span>{new Date(appt.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</span>
          </p>
          <p className="text-xs text-muted flex items-center gap-2">
            <Scissors size={12} className="text-accent" />
            <span className="font-semibold text-white">{appt.service}</span>
            <span>•</span>
            <span className="text-accent font-bold">₹{appt.price}</span>
          </p>
        </div>
      </div>

      {!hideActions && appt.status !== 'cancelled' && (
        <div className="flex gap-2 mt-4 pt-3 border-t border-border/50 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onReschedule}
            className="flex-1 text-xs font-bold text-accent bg-surface hover:bg-surface-hover border border-border py-2 rounded-xl transition-all"
          >
            Reschedule
          </button>
          <button
            onClick={onCancel}
            className="flex-1 text-xs font-bold text-red-500 bg-surface hover:bg-surface-hover border border-border py-2 rounded-xl transition-all"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
