import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { ArrowLeft, CheckCircle2, RotateCcw, Sparkles } from 'lucide-react';
import { audio } from '../../services/audioService';
import { offlineService } from '../../services/offlineStore';

interface Item {
  id: number;
  type: 'golden_tips' | 'green_leaf' | 'stone';
  label: string;
  icon: string;
}

export const DhyaanKendraGame: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [score, setScore] = useState(0);
  const [items, setItems] = useState<Item[]>([
    { id: 1, type: 'golden_tips', label: 'Golden Tip (সোণালী চাহ পাত)', icon: '🍃' },
    { id: 2, type: 'green_leaf', label: 'Green Leaf (কেঁচা পাত)', icon: '🌿' },
    { id: 3, type: 'golden_tips', label: 'Golden Tip', icon: '🍃' },
    { id: 4, type: 'stone', label: 'Pebble (শিলগুটি)', icon: '🪨' },
  ]);
  const [targetType, setTargetType] = useState<'golden_tips'>('golden_tips');
  const [completed, setCompleted] = useState(false);

  const handlePick = async (item: Item) => {
    if (item.type === targetType) {
      audio.playSuccessChord();
      setScore((s) => s + 50);
      setItems((prev) => prev.filter((i) => i.id !== item.id));

      if (items.filter((i) => i.type === targetType).length <= 1) {
        setCompleted(true);
        confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });

        await offlineService.recordTelemetry({
          patient_id: 'ner-pat-78902-assamese',
          session_id: `dhyaan-${Date.now()}`,
          game_id: 'dhyaan_kendra',
          completion_time_ms: 1100,
          error_count: 0,
          hesitation_pause_ms: 80,
          timestamp: new Date().toISOString(),
        });
      }
    } else {
      audio.playPluck(220);
    }
  };

  const resetGame = () => {
    setScore(0);
    setCompleted(false);
    setItems([
      { id: 1, type: 'golden_tips', label: 'Golden Tip (সোণালী চাহ পাত)', icon: '🍃' },
      { id: 2, type: 'green_leaf', label: 'Green Leaf (কেঁচা পাত)', icon: '🌿' },
      { id: 3, type: 'golden_tips', label: 'Golden Tip', icon: '🍃' },
      { id: 4, type: 'stone', label: 'Pebble (শিলগুটি)', icon: '🪨' },
      { id: 5, type: 'golden_tips', label: 'Golden Tip', icon: '🍃' },
    ]);
  };

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between glass-card p-4 rounded-2xl border border-white/10">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-300 hover:text-white px-3 py-1.5 rounded-xl hover:bg-white/5 text-sm font-semibold transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back (ঘূৰি যাওক)</span>
        </button>

        <div className="text-sm font-medium">
          Score: <strong className="text-[#ff7a29]">{score}</strong>
        </div>
      </div>

      <div className="glass-card p-8 rounded-3xl border border-white/10 text-center space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            ধ্যান কেন্দ্ৰ (Tea Garden Sorting - চাহ পাত বাছনি)
          </h2>
          <p className="text-slate-300 text-sm max-w-md mx-auto">
            Tap and collect all the <strong className="text-[#ff7a29]">Golden Tips (সোণালী চাহ পাত 🍃)</strong> and avoid stones.
          </p>
        </div>

        {!completed ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-lg mx-auto py-4">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => handlePick(item)}
                className="p-6 rounded-2xl glass-card border border-white/10 hover:border-[#ff5a00] hover:scale-105 transition-all text-center space-y-2 shadow-md active:scale-95"
              >
                <span className="text-5xl block">{item.icon}</span>
                <span className="text-xs font-semibold text-white block">{item.label}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="py-8 space-y-4 animate-fade-in">
            <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto" />
            <h3 className="text-2xl font-bold text-white">চাহ পাত বাছনি সম্পূৰ্ণ হ’ল!</h3>
            <p className="text-slate-400 text-sm">Great sustained attention and hand-eye accuracy.</p>
            <button onClick={resetGame} className="btn-primary px-8 py-3 text-sm font-bold mx-auto">
              Play Again (পুনৰ আৰম্ভ কৰক)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
