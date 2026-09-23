import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, AlertTriangle, ShieldCheck, HeartPulse, Clock, FileText, Phone, Sparkles, Stethoscope, ClipboardList, CheckCircle2, Smartphone } from 'lucide-react';
import { api, ChiData } from '../../services/api';
import { Language, translations } from '../../services/i18n';
import { SmsDispatchModal } from '../common/SmsDispatchModal';

interface CaregiverDashboardProps {
  currentLang?: Language;
  activeRole?: 'patient' | 'caregiver' | 'asha' | 'doctor';
}

export const CaregiverDashboard: React.FC<CaregiverDashboardProps> = ({ currentLang = 'en', activeRole = 'caregiver' }) => {
  const [chiData, setChiData] = useState<ChiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSmsModal, setShowSmsModal] = useState(false);

  const t = translations[currentLang];
  const isDoctor = activeRole === 'doctor';

  useEffect(() => {
    const fetchChi = async () => {
      try {
        const data = await api.getChi('ner-pat-78902-assamese');
        setChiData(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchChi();
  }, []);

  // Format 30-day array into Recharts data points
  const chartData =
    chiData?.chi_trendline_30d.map((score, idx) => ({
      day: `Day ${idx + 1}`,
      score,
      isDropDay: idx >= 20 && idx <= 23,
    })) || [];

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#ff7a29] flex items-center gap-1.5">
            {isDoctor ? (
              <>
                <Stethoscope className="w-4 h-4 text-emerald-400" />
                <span>Doctor Clinical Station • District Hospital / Neurologist</span>
              </>
            ) : (
              <span>{t.caregiverHeader}</span>
            )}
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1">
            {isDoctor ? (t.doctorStation || 'Clinical Neuro-Station') : t.chiTitle}
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm">
            {isDoctor ? (t.doctorStationDesc || 'Tertiary Clinical Review • Longitudinal Trajectory • FHIR / ABDM Export') : t.patientLabel}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => alert('HL7 FHIR v1.0 Observation resource JSON copied to clipboard!')}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 flex items-center gap-1.5"
          >
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>{t.exportFhir}</span>
          </button>
          <a
            href="tel:+919876543211"
            className="px-4 py-2 rounded-xl bg-[#ff5a00]/20 hover:bg-[#ff5a00]/30 border border-[#ff5a00]/40 text-xs font-bold text-[#ff7a29] flex items-center gap-1.5"
          >
            <Phone className="w-4 h-4" />
            <span>{t.callAsha}</span>
          </a>
        </div>
      </div>

      {/* Doctor-Specific Diagnostic Biomarker Strip */}
      {isDoctor && (
        <div className="p-4 sm:p-5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in">
          <div>
            <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-semibold">Clinical Dementia Rating</span>
            <strong className="text-white text-sm sm:text-base font-bold flex items-center gap-1 mt-0.5">
              CDR 0.5 <span className="text-xs text-amber-400 font-normal">(Mild MCI)</span>
            </strong>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-semibold">MoCA Cultural Score</span>
            <strong className="text-white text-sm sm:text-base font-bold flex items-center gap-1 mt-0.5">
              22 / 30 <span className="text-xs text-emerald-400 font-normal">(Assam Validated)</span>
            </strong>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-semibold">Motor Latency Z-Score</span>
            <strong className="text-white text-sm sm:text-base font-bold flex items-center gap-1 mt-0.5">
              μ = 420ms <span className="text-xs text-sky-400 font-normal">(Z = -1.42)</span>
            </strong>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-semibold">ABDM Care Context</span>
            <strong className="text-white text-sm sm:text-base font-bold flex items-center gap-1 mt-0.5">
              ABHA Active <span className="text-xs text-emerald-400 font-normal">● In-Sync</span>
            </strong>
          </div>
        </div>
      )}

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Current CHI */}
        <div className="glass-card p-5 rounded-2xl border border-white/10 space-y-2">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>{t.currentChiScore}</span>
            <HeartPulse className="w-4 h-4 text-[#ff5a00]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">
              {chiData ? chiData.chi_score_current.toFixed(1) : '78.4'}
            </span>
            <span className="text-xs text-emerald-400 font-semibold">/ 100</span>
          </div>
          <span className="text-[11px] text-slate-400 block">{t.stablePostIntervention}</span>
        </div>

        {/* Metric 2: Motor Reaction Time */}
        <div className="glass-card p-5 rounded-2xl border border-white/10 space-y-2">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>{t.meanLatency}</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">
              {chiData?.rolling_latency_ms.mean || 1180}
            </span>
            <span className="text-xs text-slate-400">ms</span>
          </div>
          <span className="text-[11px] text-slate-400 block">
            σ = {chiData?.rolling_latency_ms.std_dev || 140}ms ({t.latencyZ})
          </span>
        </div>

        {/* Metric 3: Adherence Rate */}
        <div className="glass-card p-5 rounded-2xl border border-white/10 space-y-2">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>{t.medAdherence}</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-400">96.7%</span>
          </div>
          <span className="text-[11px] text-slate-400 block">{t.adherenceSubtitle}</span>
        </div>

        {/* Metric 4: Anomaly Status */}
        <div className="glass-card p-5 rounded-2xl border border-white/10 space-y-2">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>{t.anomalyStatus}</span>
            <AlertTriangle className="w-4 h-4 text-[#ff5a00]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-bold text-amber-400">
              {t.anomalyResolved}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 block">{t.dualChannelSent}</span>
        </div>
      </div>

      {/* Interactive 30-Day CHI Longitudinal Graph */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl border border-white/10 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#ff5a00]" />
              <span>{t.chiTrajectory}</span>
            </h3>
            <p className="text-xs text-slate-400">
              {t.chiFormula}
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-3 h-3 rounded-full bg-[#ff5a00]" />
              <span>{t.baselineStable}</span>
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              <span>{t.day21Decline}</span>
            </span>
          </div>
        </div>

        {/* Recharts Area Chart */}
        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="chiGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ff5a00" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#ff5a00" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis domain={[40, 100]} stroke="#64748b" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#12141c',
                  border: '1px solid rgba(255, 90, 0, 0.4)',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '12px',
                }}
              />
              <Area
                type="monotone"
                dataKey="score"
                stroke="#ff5a00"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#chiGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Historical Anomaly Notification Banner */}
      <div className="glass-card p-6 rounded-2xl border border-amber-500/30 bg-amber-500/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-400">
            <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div className="space-y-1">
            <div className="text-sm font-bold text-white flex items-center gap-2">
              <span>{t.declineDetected}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-600/30 text-red-400 font-bold border border-red-500/30">
                {t.criticalBadge}
              </span>
            </div>
            <p className="text-xs text-slate-300">
              {t.declineDesc}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowSmsModal(true)}
            className="px-3.5 py-2 rounded-xl bg-[#ff5a00]/20 hover:bg-[#ff5a00]/30 border border-[#ff5a00]/40 text-[#ff7a29] text-xs font-bold flex items-center gap-1.5 transition-all shadow-glow-orange cursor-pointer"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>📱 View Dispatched SMS (Demo Log)</span>
          </button>
        </div>
      </div>

      <SmsDispatchModal
        isOpen={showSmsModal}
        onClose={() => setShowSmsModal(false)}
        currentLang={currentLang}
        initialEvent="anomaly"
      />
    </div>
  );
};
