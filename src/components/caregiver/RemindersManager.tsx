import React, { useState, useEffect } from 'react';
import { Plus, Check, Clock, Droplets, Pill, Calendar, Heart, ShieldCheck } from 'lucide-react';
import { api, ReminderItem } from '../../services/api';
import { audio } from '../../services/audioService';
import { offlineService } from '../../services/offlineStore';

export const RemindersManager: React.FC = () => {
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<'medication' | 'hydration' | 'daily_routine' | 'appointment'>('hydration');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadReminders();
  }, []);

  const loadReminders = async () => {
    try {
      const data = await api.listReminders('ner-pat-78902-assamese');
      setReminders(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleConfirm = async (item: ReminderItem) => {
    audio.playSuccessChord();

    // 1. Record in local Dexie store immediately (sub-15ms offline guarantee)
    await offlineService.recordMedication({
      patient_id: item.patient_id,
      title: item.title,
      scheduled_at: item.scheduled_at,
      confirmed_at: new Date().toISOString(),
      status: 'taken',
    });

    // 2. Call backend
    await api.confirmReminder(item.id, true);

    // Update UI state
    setReminders((prev) =>
      prev.map((r) => (r.id === item.id ? { ...r, status: 'completed', caregiver_verified: true } : r))
    );
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newReminder: ReminderItem = {
      id: `rem-${Date.now()}`,
      patient_id: 'ner-pat-78902-assamese',
      reminder_type: newType,
      title: newTitle,
      scheduled_at: new Date().toISOString(),
      status: 'pending',
      caregiver_verified: false,
    };

    setReminders([newReminder, ...reminders]);
    setNewTitle('');
    setShowAddModal(false);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'medication':
        return <Pill className="w-5 h-5 text-[#ff5a00]" />;
      case 'hydration':
        return <Droplets className="w-5 h-5 text-sky-400" />;
      case 'daily_routine':
        return <Calendar className="w-5 h-5 text-amber-400" />;
      case 'appointment':
        return <Heart className="w-5 h-5 text-rose-400" />;
      default:
        return <Clock className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-[#ff7a29] block">
            Adherence & Routine Manager
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            দৈনিক ঔষধ আৰু দিনলিপি (Daily Care Schedule)
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm">
            Auditory and tactile cues scheduled for elderly patients in rural Assam.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary px-5 py-2.5 text-xs font-bold flex items-center gap-1.5 shadow-glow-orange"
        >
          <Plus className="w-4 h-4" />
          <span>Add Reminder (নতুন সূচী)</span>
        </button>
      </div>

      {/* Reminders List */}
      <div className="space-y-3.5">
        {reminders.map((item) => (
          <div
            key={item.id}
            className={`glass-card p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              item.status === 'completed'
                ? 'border-emerald-500/30 bg-emerald-500/5'
                : 'border-white/10 hover:border-[#ff5a00]/40'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                {getIcon(item.reminder_type)}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">{item.title}</h3>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-white/5 text-slate-300 border border-white/10">
                    {item.reminder_type}
                  </span>
                </div>
                {item.description && (
                  <p className="text-xs text-slate-400">{item.description}</p>
                )}
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Scheduled: {new Date(item.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 self-end sm:self-center">
              {item.status === 'completed' ? (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-1.5 rounded-full">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Confirmed by Caregiver</span>
                </div>
              ) : (
                <button
                  onClick={() => handleConfirm(item)}
                  className="px-5 py-2 rounded-full bg-[#ff5a00] hover:bg-[#ff7300] text-white text-xs font-bold flex items-center gap-1.5 shadow-glow-orange transition-all"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Mark Done (গ্ৰহণ কৰিলোঁ)</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Reminder Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="glass-card max-w-md w-full rounded-3xl p-6 sm:p-8 border border-white/10 space-y-4">
            <h3 className="text-xl font-bold text-white">Create New Schedule Item</h3>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Reminder Category</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as any)}
                  className="input-field w-full p-2.5 rounded-xl text-xs"
                >
                  <option value="hydration" className="bg-[#12141c]">💧 Hydration (পানী খোৱা)</option>
                  <option value="medication" className="bg-[#12141c]">💊 Medication (ঔষধ)</option>
                  <option value="daily_routine" className="bg-[#12141c]">☀️ Daily Routine (দিনলিপি)</option>
                  <option value="appointment" className="bg-[#12141c]">🏥 Doctor Visit (চিকিৎসকৰ পৰামৰ্শ)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Activity Title</label>
                <input
                  type="text"
                  placeholder="e.g. Afternoon Tea & Memory Puzzle"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  className="input-field w-full p-2.5 rounded-xl text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="w-1/2 py-2.5 rounded-full bg-white/10 text-xs font-semibold text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary w-1/2 py-2.5 text-xs font-bold"
                >
                  Save Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
