import React, { useState } from 'react';
import { 
  MessageSquare, 
  UserPlus, 
  Calendar, 
  CheckCircle2, 
  Clock,
  Zap,
  ArrowRight,
  PlayCircle
} from 'lucide-react';
import { motion } from 'motion/react';

const workflows = [
  { 
    id: '1', 
    title: 'Appointment Reminders', 
    description: 'Sent 24 hours before the appointment to reduce no-shows.',
    enabled: true,
    steps: [
      { type: 'trigger', label: 'Appointment Booked', icon: Calendar },
      { type: 'wait', label: '24 Hours Before', icon: Clock },
      { type: 'action', label: 'Send WhatsApp Reminder', icon: MessageSquare },
      { type: 'end', label: 'Workflow Complete', icon: CheckCircle2 }
    ]
  },
  { 
    id: '2', 
    title: 'New Client Welcome', 
    description: 'Sent immediately after a client\'s first visit with a discount code.',
    enabled: true,
    steps: [
      { type: 'trigger', label: 'First Visit Completed', icon: UserPlus },
      { type: 'wait', label: 'Immediate', icon: Zap },
      { type: 'action', label: 'Send Welcome Message', icon: MessageSquare },
      { type: 'end', label: 'Workflow Complete', icon: CheckCircle2 }
    ]
  },
  { 
    id: '3', 
    title: 'Post-Visit Follow-up', 
    description: 'Sent 2 days after visit to ask for a review or feedback.',
    enabled: false,
    steps: [
      { type: 'trigger', label: 'Visit Completed', icon: CheckCircle2 },
      { type: 'wait', label: '2 Days After', icon: Clock },
      { type: 'action', label: 'Send Feedback Request', icon: MessageSquare },
      { type: 'end', label: 'Workflow Complete', icon: CheckCircle2 }
    ]
  }
];

export default function AutomationSettings() {
  const [testPhone, setTestPhone] = useState('917439784129');
  const [testName, setTestName] = useState('Jared Manuel');
  const [statusMsg, setStatusMsg] = useState('');

  const triggerTest = async (event: string, templateId: string, variables: string[], extra: any = {}) => {
    setStatusMsg(`Sending test for ${event}...`);
    try {
      const response = await fetch('/api/automation/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event,
          customer: { name: testName, phone: testPhone },
          template_id: templateId,
          variables,
          testMode: true,
          ...extra
        })
      });
      if (response.ok) {
        setStatusMsg(`Success: Triggered event '${event}' using template '${templateId}' (Test delay applied).`);
      } else {
        const errData = await response.json();
        setStatusMsg(`Error: ${errData.error || response.statusText}`);
      }
    } catch (err: any) {
      setStatusMsg(`Network Error: ${err.message}`);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ ease: [0.22, 1, 0.36, 1], duration: 0.6 }}
      className="space-y-8 max-w-5xl mx-auto pb-12"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">WhatsApp Automations</h1>
          <p className="text-muted">Monitor your active automated workflows</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-accent/10 text-accent rounded-full border border-accent/20">
          <span className="w-2 h-2 bg-accent rounded-full animate-pulse"></span>
          <span className="text-xs font-bold uppercase tracking-widest">MSG91 Active</span>
        </div>
      </div>

      {/* Production Status */}
      <div className="glass rounded-[2rem] p-8 bg-accent/5 border border-accent/20 space-y-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-accent/10 rounded-2xl text-accent">
            <PlayCircle size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold">Production Status</h3>
            <p className="text-sm text-muted">Your WhatsApp sender is currently active and monitoring triggers.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-surface rounded-2xl border border-border">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-1">Messages Sent (24h)</p>
            <p className="text-2xl font-bold">1,240</p>
          </div>
          <div className="p-4 bg-surface rounded-2xl border border-border">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-1">Delivery Rate</p>
            <p className="text-2xl font-bold text-accent">99.2%</p>
          </div>
          <div className="p-4 bg-surface rounded-2xl border border-border">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted mb-1">Active Workflows</p>
            <p className="text-2xl font-bold">8</p>
          </div>
        </div>
      </div>

      {/* WhatsApp Automation Testing Panel */}
      <div className="glass rounded-[2rem] p-8 space-y-6 border border-accent/25 bg-accent/5 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 bg-accent/10 text-accent text-[9px] font-bold uppercase px-3 py-1 rounded-bl-xl tracking-widest">
          Developer console
        </div>
        <div>
          <h3 className="text-xl font-bold">WhatsApp Automation Tester</h3>
          <p className="text-sm text-muted mt-1">Test your templates instantly. Triggered test requests run with shortened delays (5s) for quick verification.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-muted mb-2 block">Test Phone Number</label>
            <input 
              type="text" 
              placeholder="e.g. 917439784129"
              value={testPhone}
              onChange={(e) => setTestPhone(e.target.value)}
              className="w-full bg-surface border border-border rounded-xl py-3 px-4 focus:outline-none focus:border-accent/50 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-muted mb-2 block">Test Client Name</label>
            <input 
              type="text" 
              placeholder="e.g. Jared Manuel"
              value={testName}
              onChange={(e) => setTestName(e.target.value)}
              className="w-full bg-surface border border-border rounded-xl py-3 px-4 focus:outline-none focus:border-accent/50 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <TestTriggerButton 
            label="1. Booking Confirmation" 
            sub="appointment_confirmed_wa_text_v1"
            onClick={() => triggerTest('appointment_confirmed', 'appointment_confirmed_wa_text_v1', [
              new Date().toLocaleString(),
              "Haircut & Styling",
              testPhone
            ])}
          />
          <TestTriggerButton 
            label="2. Booking Reminder" 
            sub="appointment_reminder_text"
            onClick={() => triggerTest('appointment_reminder', 'appointment_reminder_text', [
              new Date().toLocaleDateString(),
              "11:00 AM"
            ], {
              appointmentDate: new Date().toISOString().split('T')[0],
              appointmentTime: new Date(Date.now() + 10 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            })}
          />
          <TestTriggerButton 
            label="3. Reschedule Text" 
            sub="appointment_reschedule_text"
            onClick={() => triggerTest('appointment_rescheduled', 'appointment_reschedule_text', [
              "Facial Treatment",
              new Date().toLocaleDateString(),
              "03:00 PM"
            ])}
          />
          <TestTriggerButton 
            label="4. POS Confirmation" 
            sub="pos_checkout_confirmation"
            onClick={() => triggerTest('payment_received', 'pos_checkout_confirmation', [
              "1500",
              "Haircut, Beard Trim, Pedicure"
            ])}
          />
          <TestTriggerButton 
            label="5. Google Review" 
            sub="google_review_follow_up_text"
            onClick={() => triggerTest('google_review_follow_up', 'google_review_follow_up_text', [
              "Haircut & Beard Trim"
            ])}
          />
          <TestTriggerButton 
            label="6. Upsell Follow-up" 
            sub="appointment_follow_up_upsell"
            onClick={() => triggerTest('checkout_upsell', 'appointment_follow_up_upsell', [
              "Haircut & Beard Trim"
            ])}
          />
        </div>

        {statusMsg && (
          <div className="p-4 bg-accent/10 border border-accent/20 rounded-xl text-xs text-accent font-mono flex items-center justify-between animate-pulse">
            <span>{statusMsg}</span>
            <button onClick={() => setStatusMsg('')} className="text-muted hover:text-white font-bold uppercase text-[9px] tracking-wider">Dismiss</button>
          </div>
        )}
      </div>

      {/* Workflow Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {workflows.map((workflow) => (
          <div key={workflow.id} className="glass rounded-[2rem] p-8 space-y-6 flex flex-col justify-between transition-all">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="p-4 bg-surface rounded-2xl text-accent border border-border">
                  {workflow.steps[0].icon && (() => {
                    const Icon = workflow.steps[0].icon;
                    return <Icon size={28} />;
                  })()}
                </div>
                <div className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full ${workflow.enabled ? 'bg-accent/10 text-accent border border-accent/20' : 'bg-surface text-muted border border-border'}`}>
                  {workflow.enabled ? 'Active' : 'Paused'}
                </div>
              </div>
              <div>
                <h4 className="text-xl font-bold">{workflow.title}</h4>
                <p className="text-sm text-muted mt-2 leading-relaxed">{workflow.description}</p>
              </div>
            </div>
            
            <div className="space-y-4 pt-6 border-t border-border">
              <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
                {workflow.steps.map((step, i) => (
                  <React.Fragment key={i}>
                    <div className="shrink-0 p-2 bg-surface rounded-lg border border-border flex items-center gap-2">
                      {(() => {
                        const Icon = step.icon;
                        return <Icon size={14} className="text-accent" />;
                      })()}
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted">{step.type}</span>
                    </div>
                    {i < workflow.steps.length - 1 && <ArrowRight size={12} className="text-muted shrink-0" />}
                  </React.Fragment>
                ))}
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted">Last run: {Math.floor(Math.random() * 60)}m ago</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function TestTriggerButton({ label, sub, onClick }: { label: string; sub: string; onClick: () => void }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="p-4 bg-surface border border-border hover:border-accent/40 rounded-2xl text-left transition-all group flex flex-col justify-between h-24 cursor-pointer"
    >
      <span className="font-bold text-sm text-white group-hover:text-accent transition-colors">{label}</span>
      <span className="text-[9px] text-muted font-mono truncate w-full mt-2">{sub}</span>
    </motion.button>
  );
}
