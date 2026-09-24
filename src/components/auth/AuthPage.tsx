import React, { useState } from 'react';
import { Brain, User, Mail, Lock, Phone, ArrowRight, ShieldCheck, Sparkles, HeartPulse, Activity, Globe } from 'lucide-react';
import { NeuralBrainCanvas } from '../common/NeuralBrainCanvas';
import { Language, translations } from '../../services/i18n';
import { api } from '../../services/api';

interface AuthPageProps {
  currentLang: Language;
  onLanguageChange?: (lang: Language) => void;
  onLoginSuccess: (user: any, role: 'patient' | 'caregiver' | 'asha' | 'doctor') => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ currentLang, onLanguageChange, onLoginSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(true);
  const [fullName, setFullName] = useState('');
  const [emailOrPhone, setEmailOrPhone] = useState('+919876543210');
  const [passwordOrPin, setPasswordOrPin] = useState('123456');
  const [selectedRole, setSelectedRole] = useState<'patient' | 'caregiver' | 'asha' | 'doctor'>('caregiver');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const t = translations[currentLang];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      // Use OTP verification API
      const res = await api.verifyOtp({
        phone_number: emailOrPhone,
        otp: passwordOrPin || '123456',
        full_name: fullName || 'SmritiSetu User',
        role: selectedRole,
      });

      onLoginSuccess(res.user, selectedRole);
    } catch (err: any) {
      // Fallback for seamless demo
      onLoginSuccess(
        {
          full_name: fullName || 'Bonti Aita (বন্টি আইতা)',
          phone_number: emailOrPhone,
          role: selectedRole,
        },
        selectedRole
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = (role: 'patient' | 'caregiver' | 'asha') => {
    setSelectedRole(role);
    onLoginSuccess(
      {
        full_name:
          role === 'patient'
            ? 'Bonti Aita (বন্টি আইতা)'
            : role === 'caregiver'
              ? 'Rongmon Barua (যত্নকাৰী)'
              : 'Mina Das (আশা কৰ্মী)',
        phone_number: '+919876543210',
        role,
      },
      role
    );
  };

  return (
    <div className="min-h-screen bg-[#07080c] text-slate-100 flex flex-col justify-center px-4 sm:px-6 lg:px-12 py-10 relative overflow-hidden">
      {/* Top Bar for Language Switcher on Auth Screen */}
      {onLanguageChange && (
        <div className="absolute top-6 right-6 z-20 flex items-center bg-black/50 border border-white/10 rounded-xl px-3 py-1.5 backdrop-blur-md">
          <Globe className="w-4 h-4 text-slate-400 mr-2" />
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
      )}

      {/* Background radial gradient glow */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#ff5a00]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[500px] h-[500px] bg-[#ff8c00]/05 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
        {/* Left Column: Visual Brand, Glowing Neural Brain & Tagline (Matches reference photo) */}
        <div className="lg:col-span-7 flex flex-col justify-center space-y-2 sm:space-y-4 lg:space-y-6">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#ff5a00] to-[#ff9e00] flex items-center justify-center shadow-glow-orange">
              <Brain className="w-7 h-7 text-white stroke-[2.5]" />
            </div>
            <span className="text-3xl font-extrabold tracking-tight text-white">
              {t.appName} <span className="text-sm font-semibold text-[#ff6f00] px-2.5 py-0.5 rounded-full bg-[#ff5a00]/15 border border-[#ff5a00]/30 ml-1">NER</span>
            </span>
          </div>

          {/* Interactive Neural Brain Visualization */}
          <div className="relative w-full max-w-[500px] h-[320px] sm:h-[380px] -my-8 sm:-my-10">
            <NeuralBrainCanvas className="w-full h-full" />

            {/* Floating Telemetry Badges */}
            <div className="absolute top-6 left-2 glass-card px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-2 shadow-lg animate-pulse">
              <Activity className="w-3.5 h-3.5 text-[#ff7a29]" />
              <span className="text-[11px] font-semibold text-slate-300">{t.loincBadge}</span>
            </div>


          </div>

          {/* Headline directly from user reference mockup */}
          <div className="space-y-1 sm:space-y-2">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-[1.18] text-white">
              {t.tagline1}<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff5a00] via-[#ff7700] to-[#ff9e00] text-glow-orange">
                {t.tagline2}
              </span>
            </h1>
            <p className="text-slate-400 text-sm sm:text-base max-w-xl leading-relaxed">
              {t.subtagline}
            </p>
          </div>


        </div>

        {/* Right Column: Sleek Glassmorphism Auth Card (Matches reference photo) */}
        <div className="lg:col-span-5 flex justify-center">
          <div className="w-full max-w-md glass-card rounded-3xl p-8 sm:p-10 border border-white/10 shadow-2xl relative">
            <div className="space-y-2 mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {isSignUp ? t.createAccount : t.signIn}
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm">
                {isSignUp ? t.signUpDesc : t.signInDesc}
              </p>
            </div>

            {/* Select Role / Persona */}
            <div className="mb-5">
              <label className="text-xs font-medium text-slate-400 block mb-1.5">{t.selectRole}</label>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-black/40 rounded-xl border border-white/5 text-[11px]">
                <button
                  type="button"
                  onClick={() => setSelectedRole('patient')}
                  className={`py-1.5 rounded-lg font-medium transition-all ${selectedRole === 'patient' ? 'bg-[#ff5a00] text-white font-bold' : 'text-slate-400'
                    }`}
                >
                  {t.patientRole}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRole('caregiver')}
                  className={`py-1.5 rounded-lg font-medium transition-all ${selectedRole === 'caregiver' ? 'bg-[#ff5a00] text-white font-bold' : 'text-slate-400'
                    }`}
                >
                  {t.caregiverRole}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRole('asha')}
                  className={`py-1.5 rounded-lg font-medium transition-all ${selectedRole === 'asha' ? 'bg-[#ff5a00] text-white font-bold' : 'text-slate-400'
                    }`}
                >
                  {t.ashaRole}
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name input (for Sign Up) */}
              {isSignUp && (
                <div>
                  <div className="relative flex items-center">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                    <input
                      type="text"
                      placeholder={t.fullName}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="input-field w-full pl-10 pr-4 py-3 rounded-xl text-sm"
                    />
                  </div>
                </div>
              )}

              {/* Email / Phone input */}
              <div>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                  <input
                    type="text"
                    placeholder={t.emailOrPhone}
                    value={emailOrPhone}
                    onChange={(e) => setEmailOrPhone(e.target.value)}
                    required
                    className="input-field w-full pl-10 pr-4 py-3 rounded-xl text-sm"
                  />
                </div>
              </div>

              {/* Password or 4-digit PIN */}
              <div>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                  <input
                    type="password"
                    placeholder={t.passwordOrPin}
                    value={passwordOrPin}
                    onChange={(e) => setPasswordOrPin(e.target.value)}
                    required
                    className="input-field w-full pl-10 pr-4 py-3 rounded-xl text-sm"
                  />
                </div>
              </div>

              {/* Submit Button in glowing orange */}
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full py-3.5 flex items-center justify-center gap-2 mt-4 text-sm font-bold tracking-wide"
              >
                <span>{isSignUp ? t.signUpBtn : t.signInBtn}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Toggle Sign Up / Sign In footer */}
            <div className="mt-6 text-center text-xs text-slate-400">
              {isSignUp ? (
                <p>
                  {t.alreadyHaveAccount}{' '}
                  <button
                    type="button"
                    onClick={() => setIsSignUp(false)}
                    className="text-[#ff7a29] hover:underline font-semibold"
                  >
                    {t.signInHere}
                  </button>
                </p>
              ) : (
                <p>
                  {t.dontHaveAccount}{' '}
                  <button
                    type="button"
                    onClick={() => setIsSignUp(true)}
                    className="text-[#ff7a29] hover:underline font-semibold"
                  >
                    {t.signUpHere}
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
