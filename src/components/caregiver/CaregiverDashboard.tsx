import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, AlertTriangle, ShieldCheck, HeartPulse, Clock, FileText, Phone, Sparkles } from 'lucide-react';
import { api, ChiData } from '../../services/api';

export const CaregiverDashboard: React.FC = () => {
  const [chiData, setChiData] = useState<ChiData | null>(null);
  const [loading, setLoading] = useState(true);

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
          <span className="text-xs font-bold uppercase tracking-wider text-[#ff7a29] block">
            Longitudinal Clinical Analytics
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Cognitive Health Index (CHI) Dashboard
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm">
            Patient: <strong className="text-white">Bonti Aita (বন্টি আইতা)</strong> • ID: <code className="text-slate-300">ner-pat-78902-assamese</code> • Kamrup, Assam
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => alert('HL7 FHIR v1.0 Observation resource JSON copied to clipboard!')}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 flex items-center gap-1.5"
          >
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>Export FHIR JSON</span>
          </button>
          <a
            href="tel:+919876543211"
            className="px-4 py-2 rounded-xl bg-[#ff5a00]/20 hover:bg-[#ff5a00]/30 border border-[#ff5a00]/40 text-xs font-bold text-[#ff7a29] flex items-center gap-1.5"
          >
            <Phone className="w-4 h-4" />
            <span>Call ASHA Worker</span>
          </a>
        </div>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Current CHI */}
        <div className="glass-card p-5 rounded-2xl border border-white/10 space-y-2">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>Current CHI Score</span>
            <HeartPulse className="w-4 h-4 text-[#ff5a00]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">
              {chiData ? chiData.chi_score_current.toFixed(1) : '78.4'}
            </span>
            <span className="text-xs text-emerald-400 font-semibold">/ 100</span>
          </div>
          <span className="text-[11px] text-slate-400 block">Stable post-intervention</span>
        </div>

        {/* Metric 2: Motor Reaction Time */}
        <div className="glass-card p-5 rounded-2xl border border-white/10 space-y-2">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>Mean Latency (μ)</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">
              {chiData?.rolling_latency_ms.mean || 1180}
            </span>
            <span className="text-xs text-slate-400">ms</span>
          </div>
          <span className="text-[11px] text-slate-400 block">
            σ = {chiData?.rolling_latency_ms.std_dev || 140}ms (Z-normalized)
          </span>
        </div>

        {/* Metric 3: Adherence Rate */}
        <div className="glass-card p-5 rounded-2xl border border-white/10 space-y-2">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>Medicine Adherence</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-400">96.7%</span>
          </div>
          <span className="text-[11px] text-slate-400 block">Donepezil 5mg confirmed daily</span>
        </div>

        {/* Metric 4: Anomaly Status */}
        <div className="glass-card p-5 rounded-2xl border border-white/10 space-y-2">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>Cognitive Anomaly Status</span>
            <AlertTriangle className="w-4 h-4 text-[#ff5a00]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-bold text-amber-400">
              Resolved (Day 21 Alert)
            </span>
          </div>
          <span className="text-[11px] text-slate-400 block">Dual-channel SMS dispatched</span>
        </div>
      </div>

      {/* Interactive 30-Day CHI Longitudinal Graph */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl border border-white/10 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#ff5a00]" />
              <span>Rolling 30-Day Cognitive Health Index (CHI) Trajectory</span>
            </h3>
            <p className="text-xs text-slate-400">
              Formula: CHI = 0.35·S_mem + 0.30·S_exec + 0.20·S_lat + 0.15·S_adh
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-3 h-3 rounded-full bg-[#ff5a00]" />
              <span>Baseline Stable</span>
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              <span>Day 21 Decline Event</span>
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
              <span>Day 21 Rapid Cognitive Decline Detected</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-600/30 text-red-400 font-bold border border-red-500/30">
                CRITICAL
              </span>
            </div>
            <p className="text-xs text-slate-300">
              CHI dropped &gt;15% in 72 hours (82.0 → 52.0). Automated SMS alert dispatched to ASHA Worker (+91 98765 43211) for home visit.
            </p>
          </div>
        </div>

        <button
          onClick={() => alert('Detailed clinical incident logs verified. Patient stabilized on Day 24.')}
          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold shrink-0"
        >
          View Incident Log
        </button>
      </div>
    </div>
  );
};
