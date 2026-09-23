import React, { useState } from 'react';
import { Smartphone, CheckCircle2, ShieldAlert, MapPin, Send, Clock, Server, ExternalLink, X, AlertTriangle, PhoneCall } from 'lucide-react';
import { audio } from '../../services/audioService';
import { Language, translations } from '../../services/i18n';

export interface SmsDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLang?: Language;
  initialEvent?: 'sos' | 'anomaly' | 'medication';
}

export const SmsDispatchModal: React.FC<SmsDispatchModalProps> = ({
  isOpen,
  onClose,
  currentLang = 'en',
  initialEvent = 'sos',
}) => {
  const [selectedEvent, setSelectedEvent] = useState<'sos' | 'anomaly' | 'medication'>(initialEvent);
  const [activeChannel, setActiveChannel] = useState<'family' | 'asha' | 'gateway'>('family');
  const [isSimulating, setIsSimulating] = useState(false);

  if (!isOpen) return null;

  const t = translations[currentLang];

  const handleSimulateSend = () => {
    setIsSimulating(true);
    audio.playPluck(880);
    setTimeout(() => {
      audio.playSuccessChord();
      setIsSimulating(false);
    }, 600);
  };

  const eventsData = {
    sos: {
      title: '🚨 Emergency One-Touch SOS Dispatch',
      badge: 'PRIORITY 1 • CRITICAL',
      badgeColor: 'bg-red-500/20 text-red-400 border-red-500/40',
      familyMsg: `[SmritiSetu EMERGENCY] 🚨 Bonti Aita has triggered an Emergency SOS from Kamrup, Assam (26.1433° N, 91.7898° E). Immediate family assistance requested. Live GPS Map: https://maps.google.com/?q=26.1433,91.7898. ASHA Worker Anjali Das has been simultaneously dispatched. Local 108 Emergency Ambulance notified.`,
      ashaMsg: `[ASHA PRIORITY 1 DISPATCH] 🚨 Household #42 (Bonti Aita, Kamrup Sub-Centre) triggered SOS. Immediate doorstep home visit required. GPS: 26.1433, 91.7898. Verify vitals & safety. Dial 108 if non-responsive.`,
      dltTemplateId: '1407161234567890123',
      timestamp: '2 mins ago (Live Demo Dispatch)',
      gatewayStatus: 'HTTP 200 DELIVERED (CDAC Mobile Seva / MSDG)',
      latencyMs: '68ms',
    },
    anomaly: {
      title: '⚠️ Algorithmic Cognitive Anomaly Alert (Day 21 CHI Drop)',
      badge: 'CLINICAL ALERT • MODERATE',
      badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
      familyMsg: `[SmritiSetu Caregiver Alert] ⚠️ Cognitive Health Index (CHI) for Bonti Aita dropped 23% over the past 48 hours (motor pause latency rose from 1,180ms to 2,420ms). ASHA Worker Anjali Das has been requested for a home check-in. Review dashboard: https://smritisetu.health/p/78902`,
      ashaMsg: `[ASHA Clinical Task] ⚠️ Patient Bonti Aita (Kamrup Rural) showed acute cognitive hesitation in morning session. Please schedule a doorstep MoCA re-screening and verify Donepezil 5mg adherence within 24 hours.`,
      dltTemplateId: '1407168923451239012',
      timestamp: 'Day 21, 09:15 AM (Logged)',
      gatewayStatus: 'HTTP 200 DELIVERED (NIC SMS Gateway)',
      latencyMs: '84ms',
    },
    medication: {
      title: '💊 Missed Medication Reminder Escalation',
      badge: 'ADHERENCE WARNING',
      badgeColor: 'bg-sky-500/20 text-sky-400 border-sky-500/40',
      familyMsg: `[SmritiSetu Reminder] 💊 Morning medicine (Donepezil 5mg) for Bonti Aita has not been confirmed as of 10:30 AM (scheduled 08:30 AM). Please check with patient.`,
      ashaMsg: `[ASHA Pill-Check Alert] 💊 Household #42 unconfirmed morning dose. Please verify during afternoon village round.`,
      dltTemplateId: '1407163345127891234',
      timestamp: 'Today, 10:30 AM',
      gatewayStatus: 'HTTP 200 DELIVERED (CDAC MSDG)',
      latencyMs: '72ms',
    },
  };

  const activeEventData = eventsData[selectedEvent];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="glass-card w-full max-w-3xl rounded-3xl p-5 sm:p-7 border border-[#ff5a00]/30 shadow-[0_0_60px_rgba(255,90,0,0.25)] relative my-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10 pr-8">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-[#ff5a00]/20 text-[#ff7a29] border border-[#ff5a00]/30">
                <Smartphone className="w-5 h-5" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Live Dual-Channel SMS Gateway Monitor
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Telecom Regulatory Authority of India (TRAI) & CDAC Mobile Seva Gateway Dispatch Preview for Demonstrations
            </p>
          </div>
        </div>

        {/* Event Selector Pill Switcher */}
        <div className="flex items-center gap-2 pt-4 pb-2 overflow-x-auto">
          <button
            onClick={() => { setSelectedEvent('sos'); audio.playPluck(520); }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 border ${
              selectedEvent === 'sos'
                ? 'bg-red-600 text-white border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]'
                : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Emergency SOS Event</span>
          </button>

          <button
            onClick={() => { setSelectedEvent('anomaly'); audio.playPluck(580); }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 border ${
              selectedEvent === 'anomaly'
                ? 'bg-amber-600 text-white border-amber-500 shadow-[0_0_15px_rgba(217,119,6,0.5)]'
                : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Day 21 CHI Drop Alert (-23%)</span>
          </button>

          <button
            onClick={() => { setSelectedEvent('medication'); audio.playPluck(640); }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 border ${
              selectedEvent === 'medication'
                ? 'bg-sky-600 text-white border-sky-500 shadow-[0_0_15px_rgba(2,132,199,0.5)]'
                : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Missed Medication SMS</span>
          </button>
        </div>

        {/* Selected Event Context Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-black/40 border border-white/5 my-3">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${activeEventData.badgeColor}`}>
              {activeEventData.badge}
            </span>
            <span className="text-xs sm:text-sm font-bold text-white">
              {activeEventData.title}
            </span>
          </div>
          <button
            onClick={handleSimulateSend}
            disabled={isSimulating}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#ff5a00] to-[#ff9d00] text-white text-xs font-bold flex items-center gap-1.5 shadow-glow-orange hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
          >
            <Send className="w-3 h-3" />
            <span>{isSimulating ? 'Dispatching...' : 'Re-Dispatch SMS'}</span>
          </button>
        </div>

        {/* Channel Switcher: Family Phone vs ASHA Phone vs Gateway Logs */}
        <div className="flex items-center gap-2 bg-black/60 p-1.5 rounded-2xl border border-white/10 mb-4">
          <button
            onClick={() => setActiveChannel('family')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeChannel === 'family'
                ? 'bg-[#ff5a00] text-white shadow-glow-orange'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>📱 Channel 1: Family Phone (+91 98765 43210)</span>
          </button>

          <button
            onClick={() => setActiveChannel('asha')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeChannel === 'asha'
                ? 'bg-[#ff5a00] text-white shadow-glow-orange'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>🩺 Channel 2: ASHA Worker (+91 98765 43211)</span>
          </button>

          <button
            onClick={() => setActiveChannel('gateway')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeChannel === 'gateway'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Gateway Telemetry</span>
          </button>
        </div>

        {/* Simulated Handset Screen (Family or ASHA) */}
        {(activeChannel === 'family' || activeChannel === 'asha') && (
          <div className="rounded-3xl border border-white/15 bg-gradient-to-b from-[#181a24] to-[#0f1118] p-4 sm:p-6 shadow-2xl relative">
            {/* Phone Top Notch Status Bar */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 pb-4 border-b border-white/10 font-mono">
              <span className="font-bold text-white">09:42 AM</span>
              <div className="flex items-center gap-2">
                <span>{activeChannel === 'family' ? 'Jio 5G (Kamrup Circle)' : 'BSNL 2G/Edge (Rural NER)'}</span>
                <span className="text-emerald-400">● 100%</span>
              </div>
            </div>

            {/* Recipient Header */}
            <div className="py-3 text-center border-b border-white/5">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#ff5a00] to-amber-500 mx-auto flex items-center justify-center text-white font-extrabold text-base shadow-lg mb-1">
                {activeChannel === 'family' ? 'FC' : 'AW'}
              </div>
              <strong className="text-white text-sm block">
                {activeChannel === 'family' ? 'Family Primary Caregiver' : 'ASHA Health Worker (Anjali Das)'}
              </strong>
              <span className="text-[11px] text-slate-400 font-mono">
                {activeChannel === 'family' ? '+91 98765 43210' : '+91 98765 43211'}
              </span>
            </div>

            {/* Simulated SMS Message Bubble */}
            <div className="py-4 space-y-3">
              <div className="text-center text-[10px] text-slate-500 font-mono">
                SMS from Govt. Gateway ID: <strong className="text-slate-300">VK-SMRITI</strong> • {activeEventData.timestamp}
              </div>

              <div className="max-w-lg mx-auto bg-black/60 border border-white/15 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3">
                <div className="flex items-center justify-between text-[11px] pb-2 border-b border-white/10">
                  <span className="font-bold text-[#ff7a29] flex items-center gap-1">
                    <Send className="w-3 h-3" />
                    <span>VK-SMRITI (CDAC MSDG)</span>
                  </span>
                  <span className="text-slate-400 font-mono text-[10px]">TRAI DLT Verified</span>
                </div>

                <p className="text-sm text-slate-100 font-sans leading-relaxed whitespace-pre-line">
                  {activeChannel === 'family' ? activeEventData.familyMsg : activeEventData.ashaMsg}
                </p>

                {/* Interactive Action Buttons */}
                <div className="pt-2 flex flex-wrap items-center gap-2 border-t border-white/10">
                  <a
                    href="https://maps.google.com/?q=26.1433,91.7898"
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-300 text-xs font-bold flex items-center gap-1.5 transition-all"
                  >
                    <MapPin className="w-3.5 h-3.5 text-red-400" />
                    <span>View GPS Location (Kamrup, Assam)</span>
                    <ExternalLink className="w-3 h-3 ml-0.5" />
                  </a>

                  <a
                    href="tel:108"
                    className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-all"
                  >
                    <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Dial 108 Ambulance</span>
                  </a>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1">
                  <span>DLT Entity: Govt. of Assam Health & Family Welfare</span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Delivered ({activeEventData.latencyMs})</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Gateway Telemetry Tab */}
        {activeChannel === 'gateway' && (
          <div className="rounded-3xl border border-white/15 bg-black/60 p-5 space-y-4 font-mono text-xs text-slate-300">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <span className="text-sm font-bold text-white">CDAC Mobile Seva / National SMS Gateway Logs</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                2/2 CHANNELS ACTIVE
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <span className="text-slate-400 block">Gateway Endpoint</span>
                <span className="text-white font-bold">https://msdgweb.mgov.gov.in/esms/push</span>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <span className="text-slate-400 block">Sender Header / Header ID</span>
                <span className="text-white font-bold">VK-SMRITI (1101552390000034123)</span>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <span className="text-slate-400 block">TRAI DLT Template ID</span>
                <span className="text-white font-bold">{activeEventData.dltTemplateId}</span>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <span className="text-slate-400 block">Payload Delivery Latency</span>
                <span className="text-emerald-400 font-bold">{activeEventData.latencyMs} (Guaranteed SLA &lt;200ms)</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-black border border-white/10 text-emerald-400 text-[10px] leading-relaxed overflow-x-auto">
              <div>[2026-09-24T00:26:12Z] DISPATCH_START: Target recipients: [&quot;+919876543210&quot;, &quot;+919876543211&quot;]</div>
              <div>[2026-09-24T00:26:12Z] GATEWAY_CONNECT: Handshake SSL TLS 1.3 with CDAC MSDG host</div>
              <div>[2026-09-24T00:26:12Z] DLT_VALIDATE: Template match 100% compliant with transactional health category</div>
              <div>[2026-09-24T00:26:12Z] CHANNEL_1_DELIVERY: +919876543210 (Family Primary) -&gt; 200 OK (MsgID: 9918231)</div>
              <div>[2026-09-24T00:26:12Z] CHANNEL_2_DELIVERY: +919876543211 (ASHA Grassroots) -&gt; 200 OK (MsgID: 9918232)</div>
              <div className="text-white font-bold">[2026-09-24T00:26:12Z] DUAL_CHANNEL_SUCCESS: Both village channels notified.</div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-4 flex items-center justify-between text-[11px] text-slate-400 border-t border-white/10 mt-4">
          <span>SmritiSetu Emergency Telephony Subsystem • National Health Mission (Assam)</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-all"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};
