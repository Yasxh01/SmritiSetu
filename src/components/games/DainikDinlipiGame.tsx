import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { ArrowLeft, CheckCircle2, RotateCcw, ListOrdered, Calendar } from 'lucide-react';
import { audio } from '../../services/audioService';
import { offlineService } from '../../services/offlineStore';
import { Language, translations } from '../../services/i18n';

interface RoutineStep {
  id: string;
  order: number;
  title: string;
  icon: string;
  time: string;
}

const getRoutineSteps = (t: Record<string, string>): RoutineStep[] => [
  { id: 'step-1', order: 1, title: t.morningTea || 'Morning Tea (7:00 AM)', icon: '☕', time: '7:00 AM' },
  { id: 'step-2', order: 2, title: t.morningPrayer || 'Morning Prayer (8:00 AM)', icon: '🪔', time: '8:00 AM' },
  { id: 'step-3', order: 3, title: t.morningMed || 'Morning Medicine (8:30 AM)', icon: '💊', time: '8:30 AM' },
  { id: 'step-4', order: 4, title: t.gardenWalk || 'Garden Walk (9:30 AM)', icon: '🌿', time: '9:30 AM' },
];

interface DainikDinlipiGameProps {
  onBack: () => void;
  currentLang?: Language;
}

export const DainikDinlipiGame: React.FC<DainikDinlipiGameProps> = ({ onBack, currentLang = 'en' }) => {
  const t = translations[currentLang];
  const steps = getRoutineSteps(t);

  const [shuffled, setShuffled] = useState<RoutineStep[]>(() =>
    [...steps].sort(() => Math.random() - 0.5)
  );
  const [placed, setPlaced] = useState<RoutineStep[]>([]);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSelect = async (step: RoutineStep) => {
    const nextOrder = placed.length + 1;

    if (step.order === nextOrder) {
      audio.playPluck(440 + nextOrder * 80);
      const newPlaced = [...placed, step];
      setPlaced(newPlaced);
      setShuffled((prev) => prev.filter((s) => s.id !== step.id));

      if (newPlaced.length === steps.length) {
        audio.playSuccessChord();
        confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
        setIsSuccess(true);

        await offlineService.recordTelemetry({
          patient_id: 'ner-pat-78902-assamese',
          session_id: `dinlipi-${Date.now()}`,
          game_id: 'dainik_dinlipi',
          completion_time_ms: 1400,
          error_count: 0,
          hesitation_pause_ms: 120,
          timestamp: new Date().toISOString(),
        });
      }
    } else {
      audio.playPluck(200);
    }
  };

  const reset = () => {
    setShuffled([...steps].sort(() => Math.random() - 0.5));
    setPlaced([]);
    setIsSuccess(false);
  };

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between glass-card p-4 rounded-2xl border border-white/10">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-300 hover:text-white px-3 py-1.5 rounded-xl hover:bg-white/5 text-sm font-semibold transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t.backToGames}</span>
        </button>

        <span className="text-xs font-semibold text-slate-400">{t.routineRecall}</span>
      </div>

      <div className="glass-card p-8 rounded-3xl border border-white/10 space-y-6 text-center">
        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            {t.dinlipiTitle}
          </h2>
          <p className="text-slate-300 text-sm max-w-md mx-auto">
            {t.dinlipiDesc}
          </p>
        </div>

        {/* Placed timeline */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-2">
          {[1, 2, 3, 4].map((num) => {
            const item = placed[num - 1];
            return (
              <div
                key={num}
                className={`h-28 rounded-2xl border flex flex-col items-center justify-center p-3 text-center transition-all ${
                  item
                    ? 'bg-[#ff5a00]/15 border-[#ff5a00] text-white shadow-glow-orange'
                    : 'bg-black/30 border-white/10 border-dashed text-slate-500'
                }`}
              >
                {item ? (
                  <>
                    <span className="text-3xl mb-1">{item.icon}</span>
                    <span className="text-xs font-bold leading-tight line-clamp-2">{item.title}</span>
                  </>
                ) : (
                  <span className="text-xs font-semibold">{t.step} {num}</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Options to click */}
        {!isSuccess ? (
          <div className="space-y-3 pt-4">
            <span className="text-xs text-slate-400 font-medium block">
              {t.whichNext}
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto">
              {shuffled.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  className="p-4 rounded-2xl glass-card border border-white/10 hover:border-[#ff5a00] hover:scale-[1.02] flex items-center gap-3 text-left transition-all active:scale-95"
                >
                  <span className="text-3xl">{item.icon}</span>
                  <div>
                    <span className="text-sm font-bold text-white block">{item.title}</span>
                    <span className="text-[11px] text-slate-400">{item.time}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="py-6 space-y-4 animate-fade-in">
            <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto" />
            <h3 className="text-2xl font-bold text-white">{t.routineComplete}</h3>
            <p className="text-slate-400 text-sm">{t.routinePraise}</p>
            <button onClick={reset} className="btn-primary px-8 py-3 text-sm font-bold mx-auto">
              {t.playAgain}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
