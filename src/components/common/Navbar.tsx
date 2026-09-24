import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Brain, Wifi, WifiOff, Globe, AlertTriangle, UserCheck, ShieldAlert, HeartPulse, Smartphone, X } from 'lucide-react';
import { Language, translations } from '../../services/i18n';
import { SmsDispatchModal } from './SmsDispatchModal';

interface NavbarProps {
  currentLang: Language;
  onLanguageChange: (lang: Language) => void;
  activeRole: 'patient' | 'caregiver' | 'asha' | 'doctor';
  onRoleChange: (role: 'patient' | 'caregiver' | 'asha' | 'doctor') => void;
  currentTab: string;
  onTabChange: (tab: string) => void;
  isOnline: boolean;
  pendingSyncCount: number;
  onTriggerSos: () => void;
  onManualSync: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentLang,
  onLanguageChange,
  activeRole,
  onRoleChange,
  currentTab,
  onTabChange,
  isOnline,
  pendingSyncCount,
  onTriggerSos,
  onManualSync,
  onLogout,
}) => {
  const [showSmsModal, setShowSmsModal] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const t = translations[currentLang];

  return (
    <header className="sticky top-0 z-50 glass-card border-b border-white/10 px-4 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
      {/* Brand Logo & Name */}
      <div
        className="flex items-center gap-3 cursor-pointer"
        onClick={() => {
          let defaultTab = 'dashboard';
          if (activeRole === 'patient') defaultTab = 'games';
          else if (activeRole === 'asha') defaultTab = 'asha';

          if (currentTab === defaultTab) {
            // Already on the homepage tab, so perform a soft reset by reloading.
            // Since we persist state in localStorage, this will safely take them
            // back to the root of the tab without logging them out.
            window.location.reload();
          } else {
            onTabChange(defaultTab);
          }
        }}
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#ff5a00] to-[#ff9d00] flex items-center justify-center shadow-glow-orange">
          <Brain className="w-6 h-6 text-white stroke-[2.5]" />
        </div>
        <div>
          <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
            SmritiSetu <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#ff5a00]/20 text-[#ff7a29] border border-[#ff5a00]/40">NER</span>
          </span>
          <span className="text-[11px] text-slate-400 block -mt-0.5">{t.appName} • AI Cognitive Care</span>
        </div>
      </div>

      {/* Navigation Tabs strictly tailored by Role (RBAC) */}
      <nav className="flex items-center gap-1.5 bg-black/40 p-1.5 rounded-2xl border border-white/5">
        {/* Patient Only: Cognitive Games */}
        {activeRole === 'patient' && (
          <button
            onClick={() => onTabChange('games')}
            className={`px-3.5 py-1.5 rounded-xl text-xs md:text-sm font-medium transition-all ${currentTab === 'games'
                ? 'bg-[#ff5a00] text-white shadow-glow-orange font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
          >
            {t.gameCenter}
          </button>
        )}

        {/* Caregiver & Doctor: Clinical / Family Analytics (Hidden for Patient & ASHA) */}
        {(activeRole === 'caregiver' || activeRole === 'doctor') && (
          <button
            onClick={() => onTabChange('dashboard')}
            className={`px-3.5 py-1.5 rounded-xl text-xs md:text-sm font-medium transition-all ${currentTab === 'dashboard'
                ? 'bg-[#ff5a00] text-white shadow-glow-orange font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
          >
            {activeRole === 'doctor' ? (t.doctorStation || 'Clinical Neuro-Station') : t.dashboard}
          </button>
        )}

        {/* Patient, Caregiver, ASHA: Reminders & Routine */}
        {(activeRole === 'patient' || activeRole === 'caregiver' || activeRole === 'asha') && (
          <button
            onClick={() => onTabChange('reminders')}
            className={`px-3.5 py-1.5 rounded-xl text-xs md:text-sm font-medium transition-all ${currentTab === 'reminders'
                ? 'bg-[#ff5a00] text-white shadow-glow-orange font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
          >
            {activeRole === 'patient' ? (t.dinlipiTitle || 'Daily Routine') : t.reminders}
          </button>
        )}

        {/* ASHA & Doctor: Village Cohort & Field Triage */}
        {(activeRole === 'asha' || activeRole === 'doctor') && (
          <button
            onClick={() => onTabChange('asha')}
            className={`px-3.5 py-1.5 rounded-xl text-xs md:text-sm font-medium transition-all ${currentTab === 'asha'
                ? 'bg-[#ff5a00] text-white shadow-glow-orange font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
          >
            {activeRole === 'doctor' ? 'Village Cohort Review' : t.ashaPortal}
          </button>
        )}
      </nav>

      {/* Right Controls: Connectivity, Language, Persona Switcher, Emergency SOS */}
      <div className="flex items-center gap-2.5">
        {/* Network / CRDT Sync Badge */}
        <div
          onClick={onManualSync}
          title={isOnline ? t.syncOnline : t.offlineMode}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border cursor-pointer transition-all ${isOnline
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse'
            }`}
        >
          {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">{isOnline ? t.online : t.offline}</span>
          {pendingSyncCount > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-[#ff5a00] text-white text-[9px] font-bold">
              {pendingSyncCount}
            </span>
          )}
        </div>

        {/* Multilingual Selector */}
        <div className="relative flex items-center bg-black/40 border border-white/10 rounded-xl px-2 py-1">
          <Globe className="w-3.5 h-3.5 text-slate-400 mr-1.5" />
          <select
            value={currentLang}
            onChange={(e) => onLanguageChange(e.target.value as Language)}
            className="bg-transparent text-xs text-slate-200 outline-none cursor-pointer pr-1"
          >
            <option value="en" className="bg-[#12141c] text-white">English (EN)</option>
            <option value="hi" className="bg-[#12141c] text-white">हिन्दी (HI)</option>
            <option value="as" className="bg-[#12141c] text-white">অসমীয়া (AS)</option>
            <option value="bn" className="bg-[#12141c] text-white">বাংলা (BN)</option>
            <option value="brx" className="bg-[#12141c] text-white">बर' (BRX)</option>
          </select>
        </div>

        {/* Role Switcher Pill */}
        <select
          value={activeRole}
          onChange={(e) => onRoleChange(e.target.value as any)}
          className="bg-black/50 border border-[#ff5a00]/30 text-[#ff7a29] text-xs font-semibold rounded-xl px-2.5 py-1 outline-none cursor-pointer hidden md:block"
        >
          <option value="patient" className="bg-[#12141c] text-white">👴 {t.patientRole}</option>
          <option value="caregiver" className="bg-[#12141c] text-white">🛡️ {t.caregiverRole}</option>
          <option value="asha" className="bg-[#12141c] text-white">🩺 {t.ashaRole}</option>
          <option value="doctor" className="bg-[#12141c] text-white">🏥 {t.doctorRole}</option>
        </select>

        {/* Live SMS Gateway Dispatch Button */}
        <button
          onClick={() => setShowSmsModal(true)}
          title="Telephony & SMS Gateway Infrastructure Logs"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#ff5a00]/20 hover:bg-[#ff5a00]/30 text-[#ff7a29] border border-[#ff5a00]/40 text-xs font-bold transition-all shadow-glow-orange cursor-pointer"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">SMS Gateway</span>
          <span className="sm:hidden">SMS</span>
        </button>


        {/* Emergency SOS Button */}
        <button
          onClick={onTriggerSos}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-[0_0_15px_rgba(239,68,68,0.5)] transition-all active:scale-95 animate-pulse"
        >
          <AlertTriangle className="w-3.5 h-3.5 fill-white stroke-red-600" />
          <span>{t.sosButton}</span>
        </button>

        {/* Exit / Switch Account */}
        <button
          onClick={() => setShowLogoutConfirm(true)}
          title="Switch Account / Sign Out"
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5"
        >
          <UserCheck className="w-4 h-4" />
        </button>
      </div>

      {/* Live Dual-Channel SMS Telephony Modal */}
      <SmsDispatchModal
        isOpen={showSmsModal}
        onClose={() => setShowSmsModal(false)}
        currentLang={currentLang}
        initialEvent="sos"
      />

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div
            className="glass-card max-w-sm w-full rounded-2xl p-6 border border-white/10 shadow-2xl flex flex-col items-center text-center relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Cross Button */}
            <button
              onClick={() => setShowLogoutConfirm(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mb-4 border border-red-500/30 mt-2">
              <UserCheck className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Logout</h3>
            <p className="text-sm text-slate-300 mb-6">Are you sure you want to log out?</p>
            <div className="flex flex-row gap-3 w-full">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-sm font-semibold text-slate-200 transition-all"
              >
                No, Go Back
              </button>
              <button
                onClick={() => {
                  setShowLogoutConfirm(false);
                  onLogout();
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-sm font-semibold text-white transition-all shadow-[0_0_15px_rgba(239,68,68,0.3)]"
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
};
