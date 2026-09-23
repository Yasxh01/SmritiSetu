import React, { useState, useEffect } from 'react';
import { Users, AlertTriangle, ShieldCheck, HeartPulse, UserPlus, FileText, CheckCircle2, MapPin } from 'lucide-react';
import { api, AshaCohortResponse } from '../../services/api';
import { Language, translations } from '../../services/i18n';

interface AshaCohortViewProps {
  currentLang?: Language;
  activeRole?: 'patient' | 'caregiver' | 'asha' | 'doctor';
}

export const AshaCohortView: React.FC<AshaCohortViewProps> = ({ currentLang = 'en', activeRole = 'asha' }) => {
  const [cohort, setCohort] = useState<AshaCohortResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [checkinMoca, setCheckinMoca] = useState(22);
  const [checkinBp, setCheckinBp] = useState('120/80');
  const [checkinNotes, setCheckinNotes] = useState('');
  const [checkinSuccess, setCheckinSuccess] = useState(false);

  const t = translations[currentLang];
  const isDoctor = activeRole === 'doctor';

  useEffect(() => {
    loadCohort();
  }, []);

  const loadCohort = async () => {
    try {
      const data = await api.getAshaCohort();
      setCohort(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;

    await api.recordAshaCheckin({
      asha_id: 'asha-kamrup-04',
      patient_id: selectedPatient,
      moca_score: Number(checkinMoca),
      blood_pressure: checkinBp,
      adherence_rating: 'good',
      notes: checkinNotes,
    });

    setCheckinSuccess(true);
    setTimeout(() => {
      setCheckinSuccess(false);
      setSelectedPatient(null);
      setCheckinNotes('');
    }, 1500);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#ff7a29] block">
            {isDoctor ? 'District Medical Officer (Doctor) Cohort Surveillance' : (t.ashaHeader || 'ASHA Grassroots Field Portal')}
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {isDoctor ? 'Village Cohort Surveillance & Clinical Triage' : t.ashaTitle}
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm">
            {isDoctor
              ? 'Multi-village cognitive trajectory oversight, ASHA escalations review, and clinical intervention approval.'
              : t.ashaSub}
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            <span>{t.dishaReady}</span>
          </span>
        </div>
      </div>

      {/* Triage Overview Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-2xl border border-white/10 space-y-1">
          <span className="text-xs text-slate-400">{t.totalEnrolled}</span>
          <div className="text-3xl font-extrabold text-white">{cohort?.total_patients || 6}</div>
          <span className="text-[11px] text-slate-500">{t.elderlyHouseholds}</span>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-red-500/30 bg-red-500/5 space-y-1">
          <span className="text-xs text-red-400 font-medium">{t.criticalDecline}</span>
          <div className="text-3xl font-extrabold text-red-400">{cohort?.critical_count || 1}</div>
          <span className="text-[11px] text-red-300/80">{t.immediateVisit}</span>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-amber-500/30 bg-amber-500/5 space-y-1">
          <span className="text-xs text-amber-400 font-medium">{t.warningLatency}</span>
          <div className="text-3xl font-extrabold text-amber-400">{cohort?.warning_count || 2}</div>
          <span className="text-[11px] text-amber-300/80">{t.followupNeeded}</span>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 space-y-1">
          <span className="text-xs text-emerald-400 font-medium">{t.stableStatus}</span>
          <div className="text-3xl font-extrabold text-emerald-400">{cohort?.stable_count || 3}</div>
          <span className="text-[11px] text-emerald-300/80">{t.consistentAdherence}</span>
        </div>
      </div>

      {/* Patient Triage Cards */}
      <div className="space-y-3.5">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Users className="w-4 h-4 text-[#ff5a00]" />
          <span>{t.villageCohortTitle}</span>
        </h3>

        {cohort?.patients.map((pat) => (
          <div
            key={pat.patient_id}
            className={`glass-card p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              pat.triage_status === 'CRITICAL_DROP'
                ? 'border-red-500/40 bg-red-500/5'
                : pat.triage_status === 'WARNING'
                ? 'border-amber-500/30 bg-amber-500/5'
                : 'border-white/10'
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <h4 className="text-base font-bold text-white">{pat.name_alias}</h4>
                <span
                  className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                    pat.triage_status === 'CRITICAL_DROP'
                      ? 'bg-red-600/30 text-red-400 border-red-500/40 animate-pulse'
                      : pat.triage_status === 'WARNING'
                      ? 'bg-amber-600/30 text-amber-400 border-amber-500/40'
                      : 'bg-emerald-600/30 text-emerald-400 border-emerald-500/40'
                  }`}
                >
                  {pat.triage_status}
                </span>
                <span className="text-[10px] uppercase font-bold text-slate-400 px-2 py-0.5 rounded bg-white/5">
                  Lang: {pat.preferred_lang.toUpperCase()}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                <span>Baseline MoCA: <strong className="text-white">{pat.baseline_moca}/30</strong></span>
                <span>Current CHI: <strong className="text-white">{pat.current_chi.toFixed(1)}</strong></span>
                {pat.active_anomaly && (
                  <span className="text-red-400 font-semibold">Alert: {pat.active_anomaly}</span>
                )}
                <span>Last Sync: {pat.last_synced}</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedPatient(pat.patient_id)}
              className="px-5 py-2.5 rounded-full bg-white/10 hover:bg-[#ff5a00] hover:text-white text-slate-200 text-xs font-bold transition-all border border-white/10 self-end sm:self-center shrink-0"
            >
              {t.recordFieldVisit}
            </button>
          </div>
        ))}
      </div>

      {/* In-Person Field Visit Modal */}
      {selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="glass-card max-w-md w-full rounded-3xl p-6 sm:p-8 border border-white/10 space-y-5">
            <h3 className="text-xl font-bold text-white">{t.recordFieldVisit}</h3>
            <p className="text-xs text-slate-400">Patient: <code className="text-white">{selectedPatient}</code></p>

            {checkinSuccess ? (
              <div className="py-6 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                <h4 className="text-lg font-bold text-white">{t.fieldVisitRecorded}</h4>
                <p className="text-xs text-slate-400">{t.fieldVisitSub}</p>
              </div>
            ) : (
              <form onSubmit={handleCheckinSubmit} className="space-y-4">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">{t.mocaScoreLabel}</label>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={checkinMoca}
                    onChange={(e) => setCheckinMoca(Number(e.target.value))}
                    required
                    className="input-field w-full p-2.5 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">{t.bloodPressureLabel}</label>
                  <input
                    type="text"
                    value={checkinBp}
                    onChange={(e) => setCheckinBp(e.target.value)}
                    required
                    className="input-field w-full p-2.5 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">{t.notesLabel}</label>
                  <textarea
                    rows={3}
                    placeholder="Patient engaged with folk music. Mood cheerful."
                    value={checkinNotes}
                    onChange={(e) => setCheckinNotes(e.target.value)}
                    className="input-field w-full p-2.5 rounded-xl text-xs"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPatient(null)}
                    className="w-1/2 py-2.5 rounded-full bg-white/10 text-xs font-semibold text-white"
                  >
                    {t.cancel}
                  </button>
                  <button type="submit" className="btn-primary w-1/2 py-2.5 text-xs font-bold">
                    {t.submitCheckin}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
