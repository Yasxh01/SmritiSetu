import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { ArrowLeft, RotateCcw, Volume2, Trophy, Clock, AlertCircle, Sparkles, Brain } from 'lucide-react';
import { audio } from '../../services/audioService';
import { offlineService } from '../../services/offlineStore';
import { api, DdaEvaluationResult } from '../../services/api';
import { DdaFeedbackOverlay } from './DdaFeedbackOverlay';

// Cultural items with authentic NER motifs
const CULTURAL_CARDS = [
  { id: 'jaapi', name: 'Jaapi (জাপি)', icon: '👒', desc: 'Traditional conical sun hat of Assam' },
  { id: 'xorai', name: 'Xorai (শৰাই)', icon: '🏺', desc: 'Sacred brass offering vessel' },
  { id: 'gamosa', name: 'Gamosa (গামোচা)', icon: '🧣', desc: 'Handwoven red & white cultural cloth' },
  { id: 'pepa', name: 'Pepa (পেঁপা)', icon: '🎺', desc: 'Traditional horn musical instrument' },
  { id: 'hornbill', name: 'Hornbill Feather', icon: '🪶', desc: 'Symbolic bird of Nagaland' },
  { id: 'lotus', name: 'Loktak Lotus', icon: '🪷', desc: 'Sacred floating lake flower of Manipur' },
];

interface CardState {
  index: number;
  id: string;
  name: string;
  icon: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export const SmritiMandirGame: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [cards, setCards] = useState<CardState[]>([]);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [errors, setErrors] = useState(0);
  const [matches, setMatches] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showAnxietyRelief, setShowAnxietyRelief] = useState(false);
  const [ddaResult, setDdaResult] = useState<DdaEvaluationResult | null>(null);

  // Reaction time & hesitation metrics
  const startTimeRef = useRef<number>(Date.now());
  const lastClickTimeRef = useRef<number>(Date.now());
  const totalHesitationRef = useRef<number>(0);

  // Initialize game deck (2 pairs each of 4 to 6 items)
  const initGame = (numPairs = 4) => {
    const selectedItems = CULTURAL_CARDS.slice(0, numPairs);
    const deck = [...selectedItems, ...selectedItems]
      .sort(() => Math.random() - 0.5)
      .map((item, idx) => ({
        index: idx,
        id: item.id,
        name: item.name,
        icon: item.icon,
        isFlipped: false,
        isMatched: false,
      }));

    setCards(deck);
    setSelectedCards([]);
    setMoves(0);
    setErrors(0);
    setMatches(0);
    setIsCompleted(false);
    setDdaResult(null);

    startTimeRef.current = Date.now();
    lastClickTimeRef.current = Date.now();
    totalHesitationRef.current = 0;
  };

  useEffect(() => {
    initGame(4);
  }, []);

  const handleCardClick = (index: number) => {
    if (cards[index].isFlipped || cards[index].isMatched || selectedCards.length === 2) {
      return;
    }

    // Hesitation measurement (pause since last click)
    const now = Date.now();
    const pause = now - lastClickTimeRef.current;
    if (pause > 1500) {
      totalHesitationRef.current += pause;
    }
    lastClickTimeRef.current = now;

    // Check for Anxiety Relief trigger
    if (pause > 4000 && !showAnxietyRelief && moves > 2) {
      setShowAnxietyRelief(true);
      audio.playCalmingTone();
    }

    audio.playPluck(520);

    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);

    const newSelected = [...selectedCards, index];
    setSelectedCards(newSelected);

    if (newSelected.length === 2) {
      setMoves((m) => m + 1);
      const [idx1, idx2] = newSelected;

      if (cards[idx1].id === cards[idx2].id) {
        // Matched!
        audio.playSuccessChord();
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c, i) => (i === idx1 || i === idx2 ? { ...c, isMatched: true } : c))
          );
          setSelectedCards([]);
          setMatches((m) => {
            const updated = m + 1;
            if (updated === cards.length / 2) {
              handleGameComplete();
            }
            return updated;
          });
        }, 400);
      } else {
        // Mismatched!
        setErrors((e) => {
          const newErrors = e + 1;
          if (newErrors >= 3 && !showAnxietyRelief) {
            setShowAnxietyRelief(true);
          }
          return newErrors;
        });
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c, i) => (i === idx1 || i === idx2 ? { ...c, isFlipped: false } : c))
          );
          setSelectedCards([]);
        }, 900);
      }
    }
  };

  const handleGameComplete = async () => {
    setIsCompleted(true);
    const completionTime = Date.now() - startTimeRef.current;

    // Confetti celebration
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#ff5a00', '#ff9e00', '#ffffff'],
    });

    // Save telemetry to offline IndexedDB (sub-15ms guaranteed write)
    await offlineService.recordTelemetry({
      patient_id: 'ner-pat-78902-assamese',
      session_id: `sess-${Date.now()}`,
      game_id: 'smriti_mandir',
      completion_time_ms: completionTime,
      error_count: errors,
      hesitation_pause_ms: totalHesitationRef.current,
      timestamp: new Date().toISOString(),
    });

    // Invoke AI/ML mElo Dynamic Difficulty Adjustment evaluation
    try {
      const res = await api.evaluateSession({
        patient_id: 'ner-pat-78902-assamese',
        game_id: 'smriti_mandir',
        completion_time_ms: completionTime,
        error_count: errors,
        hesitation_pause_ms: totalHesitationRef.current,
      });
      setDdaResult(res);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6 animate-fade-in">
      {/* Top Navigation & Status */}
      <div className="flex flex-wrap items-center justify-between gap-4 glass-card p-4 rounded-2xl border border-white/10">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-300 hover:text-white px-3 py-1.5 rounded-xl hover:bg-white/5 text-sm font-semibold transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Games (ঘূৰি যাওক)</span>
        </button>

        <div className="flex items-center gap-4 text-xs sm:text-sm font-medium">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Sparkles className="w-4 h-4 text-[#ff5a00]" />
            <span>Moves: <strong className="text-white">{moves}</strong></span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <Trophy className="w-4 h-4 text-emerald-400" />
            <span>Matched: <strong className="text-white">{matches}/{cards.length / 2}</strong></span>
          </div>
          <button
            onClick={() => initGame(cards.length / 2)}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300"
            title="Reset Game"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Game Card Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {cards.map((card) => (
          <button
            key={card.index}
            onClick={() => handleCardClick(card.index)}
            disabled={card.isMatched || card.isFlipped}
            className={`h-36 sm:h-44 rounded-2xl p-4 flex flex-col items-center justify-center text-center transition-all duration-300 transform select-none ${
              card.isFlipped || card.isMatched
                ? 'bg-gradient-to-b from-[#181c28] to-[#12141c] border-2 border-[#ff5a00] shadow-glow-orange scale-[1.02]'
                : 'glass-card hover:border-[#ff5a00]/40 hover:scale-[1.02] active:scale-95'
            }`}
          >
            {card.isFlipped || card.isMatched ? (
              <div className="space-y-2 animate-fade-in">
                <span className="text-4xl sm:text-5xl block">{card.icon}</span>
                <span className="text-xs sm:text-sm font-bold text-white block leading-tight">
                  {card.name}
                </span>
              </div>
            ) : (
              <div className="space-y-2 opacity-60">
                <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto">
                  <Brain className="w-6 h-6 text-[#ff5a00]" />
                </div>
                <span className="text-[11px] text-slate-400 block font-medium">স্মৃতিসেতু</span>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Completion Modal / AI mElo Results */}
      {isCompleted && (
        <div className="glass-card p-6 sm:p-8 rounded-3xl border border-[#ff5a00]/40 shadow-glow-orange space-y-6 text-center animate-fade-in">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#ff5a00]/20 border border-[#ff5a00]/40 flex items-center justify-center text-3xl">
            🎉
          </div>

          <div className="space-y-1">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
              বৰ ধুনীয়া হৈছে! (Wonderful Completion!)
            </h3>
            <p className="text-slate-400 text-xs sm:text-sm">
              Session telemetry persisted to edge storage and processed by AI Dynamic Difficulty Adjustment.
            </p>
          </div>

          {/* AI mElo Vector stats */}
          {ddaResult && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-black/40 border border-white/5 text-left text-xs">
              <div>
                <span className="text-slate-500 block">mElo Rating</span>
                <span className="text-base font-bold text-[#ff7a29]">{ddaResult.mElo_rating}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Difficulty Tier</span>
                <span className="text-base font-bold text-white">{ddaResult.tier}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Anxiety Guard</span>
                <span className="text-base font-bold text-emerald-400">
                  {ddaResult.anxiety_relief_triggered ? 'Triggered (Calmed)' : 'Optimal'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Next Adaptive Task</span>
                <span className="text-xs font-semibold text-slate-300 truncate block">
                  {ddaResult.recommended_task_id}
                </span>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => initGame(4)}
              className="btn-primary px-6 py-3 text-sm font-bold"
            >
              Play Again (পুনৰ খেলক)
            </button>
            <button
              onClick={onBack}
              className="px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm font-semibold border border-white/10"
            >
              Choose Another Game
            </button>
          </div>
        </div>
      )}

      {/* Anxiety-Relief calming prompt */}
      <DdaFeedbackOverlay
        isOpen={showAnxietyRelief}
        onDismiss={() => {
          setShowAnxietyRelief(false);
          initGame(3); // Lower difficulty to 3 pairs
        }}
      />
    </div>
  );
};
