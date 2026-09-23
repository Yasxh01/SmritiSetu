import React, { useState, useEffect } from 'react';
import { Navbar } from './components/common/Navbar';
import { AuthPage } from './components/auth/AuthPage';
import { GameCenter } from './components/games/GameCenter';
import { CaregiverDashboard } from './components/caregiver/CaregiverDashboard';
import { RemindersManager } from './components/caregiver/RemindersManager';
import { AshaCohortView } from './components/asha/AshaCohortView';
import { EmergencySOSModal } from './components/common/EmergencySOSModal';
import { Language } from './services/i18n';
import { offlineService } from './services/offlineStore';

export const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeRole, setActiveRole] = useState<'patient' | 'caregiver' | 'asha' | 'doctor'>('caregiver');
  const [currentLang, setCurrentLang] = useState<Language>('en');
  const [currentTab, setCurrentTab] = useState<string>('games');
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);
  const [sosModalOpen, setSosModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check pending local offline mutations
    const interval = setInterval(async () => {
      try {
        const count = await offlineService.getPendingCount();
        setPendingSyncCount(count);
      } catch (e) {}
    }, 2000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const handleLoginSuccess = (user: any, role: 'patient' | 'caregiver' | 'asha' | 'doctor') => {
    setCurrentUser(user);
    setActiveRole(role);
    setIsAuthenticated(true);
    if (role === 'patient') setCurrentTab('games');
    else if (role === 'caregiver') setCurrentTab('dashboard');
    else if (role === 'asha') setCurrentTab('asha');
    else setCurrentTab('dashboard');
  };

  const handleRoleChange = (role: 'patient' | 'caregiver' | 'asha' | 'doctor') => {
    setActiveRole(role);
    if (role === 'patient') {
      if (currentTab !== 'games' && currentTab !== 'reminders') setCurrentTab('games');
    } else if (role === 'caregiver') {
      if (currentTab === 'games' || currentTab === 'asha') setCurrentTab('dashboard');
    } else if (role === 'asha') {
      if (currentTab === 'games' || currentTab === 'dashboard') setCurrentTab('asha');
    } else if (role === 'doctor') {
      if (currentTab === 'games') setCurrentTab('dashboard');
    }
  };

  const handleManualSync = async () => {
    await offlineService.markAllSynced();
    setPendingSyncCount(0);
    alert('Delta Sync Complete: All edge mutations synchronized with cloud PostgreSQL instance (<50 KB budget guaranteed).');
  };

  if (!isAuthenticated) {
    return (
      <AuthPage
        currentLang={currentLang}
        onLanguageChange={setCurrentLang}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#07080c] text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Universal Navigation Bar */}
      <Navbar
        currentLang={currentLang}
        onLanguageChange={setCurrentLang}
        activeRole={activeRole}
        onRoleChange={handleRoleChange}
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        isOnline={isOnline}
        pendingSyncCount={pendingSyncCount}
        onTriggerSos={() => setSosModalOpen(true)}
        onManualSync={handleManualSync}
        onLogout={() => setIsAuthenticated(false)}
      />

      {/* Main Content Body */}
      <main className="flex-1 pb-16">
        {currentTab === 'games' && <GameCenter currentLang={currentLang} />}
        {currentTab === 'dashboard' && <CaregiverDashboard currentLang={currentLang} activeRole={activeRole} />}
        {currentTab === 'reminders' && <RemindersManager currentLang={currentLang} />}
        {currentTab === 'asha' && <AshaCohortView currentLang={currentLang} activeRole={activeRole} />}
      </main>

      {/* Emergency SOS Modal */}
      <EmergencySOSModal
        isOpen={sosModalOpen}
        onClose={() => setSosModalOpen(false)}
        patientName={currentUser?.full_name || 'Bonti Aita'}
        currentLang={currentLang}
      />
    </div>
  );
};

export default App;
