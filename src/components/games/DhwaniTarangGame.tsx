import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { ArrowLeft, Play, Volume2, RotateCcw, CheckCircle2, Trophy, Sparkles } from 'lucide-react';
import { audio } from '../../services/audioService';
import { offlineService } from '../../services/offlineStore';
import { api } from '../../services/api';

const INSTRUMENTS = [
  { id: 'dhol', name: 'Bihu Dhol (ঢোল)', icon: '🥁', color: 'from-amber-600 to-amber-800' },
  { id: 'tokari', name: 'Tokari String (টোকোৰী)', icon: '🪕', color: 'from-orange-600 to-orange-800' },
  { id: 'rain', name: 'Monsoon Rain (বৰষুণ)', icon: '🌧️', color: 'from-sky-600 to-sky-800' },
  { id: 'flute', name: 'Bamboo Flute (বাঁহী)', icon: '🪈', color: 'from-emerald-600 to-emerald-800' },
];

export const DhwaniTarangGame: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [sequence, setSequence] = useState<string[]>([]);
  const [playerInput, setPlayerInput] = useState<string[]>([]);
  const [isPlayingSeq, setIsPlayingSeq] = useState(false);
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const playInstrumentSound = (id: string) => {
    if (id === 'dhol') audio.playDholBeat(true);
    else if (id === 'tokari') audio.playPluck(380);
    else if (id === 'rain') audio.playCalmingTone();
    else if (id === 'flute') audio.playPluck(680);
  };

  const startNewRound = (targetLevel = level) => {
    setPlayerInput([]);
    setMessage(null);
    setIsPlayingSeq(true);

    // Generate random sequence of length = targetLevel + 1
    const newSeq: string[] = [];
    const pool = ['dhol', 'tokari', 'rain', 'flute'];
    const seqLen = Math.min(4, targetLevel + 1);

    for (let i = 0; i < seqLen; i++) {
      newSeq.push(pool[Math.floor(Math.random() * pool.length)]);
    }
    setSequence(newSeq);
    setGameStarted(true);

    // Play sounds sequentially
    newSeq.forEach((item, idx) => {
      setTimeout(() => {
        playInstrumentSound(item);
        if (idx === newSeq.length - 1) {
          setIsPlayingSeq(false);
          setMessage('এতিয়া আপোনাৰ পাল! (Now your turn to repeat the sounds!)');
        }
      }, (idx + 1) * 750);
    });
  };

  const handleTileClick = async (id: string) => {
    if (isPlayingSeq || !gameStarted) return;

    playInstrumentSound(id);
    const updated = [...playerInput, id];
    setPlayerInput(updated);

    const currentIndex = updated.length - 1;

    // Check correctness
    if (updated[currentIndex] !== sequence[currentIndex]) {
      setMessage('ভুল হৈছে, একো কথা নাই! (Try again calmly, no worries!)');
      audio.playCalmingTone();
      setTimeout(() => {
        startNewRound(level);
      }, 1400);
      return;
    }

    // Sequence completed!
    if (updated.length === sequence.length) {
      audio.playSuccessChord();
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      setMessage('অসম্ভৱ সুন্দৰ! (Brilliant rhythm memory!)');
      setScore((s) => s + 100);

      // Record telemetry
      await offlineService.recordTelemetry({
        patient_id: 'ner-pat-78902-assamese',
        session_id: `dhwani-${Date.now()}`,
        game_id: 'dhwani_tarang',
        completion_time_ms: 1250,
        error_count: 0,
        hesitation_pause_ms: 100,
        timestamp: new Date().toISOString(),
      });

      setTimeout(() => {
        setLevel((l) => l + 1);
        startNewRound(level + 1);
      }, 1600);
    }
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

        <div className="flex items-center gap-4 text-xs sm:text-sm font-medium">
          <span>Level: <strong className="text-white">{level}</strong></span>
          <span>Score: <strong className="text-[#ff7a29]">{score}</strong></span>
        </div>
      </div>

      {/* Main Sound Stage */}
      <div className="glass-card p-8 rounded-3xl border border-white/10 text-center space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            ধ্বনি তৰংগ (Dhwani Tarang)
          </h2>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            Listen to traditional folk rhythms and repeat the sequence in order.
          </p>
        </div>

        {!gameStarted ? (
          <div className="py-8">
            <button
              onClick={() => startNewRound(1)}
              className="btn-primary px-8 py-4 text-base font-bold flex items-center justify-center gap-2 mx-auto shadow-glow-orange"
            >
              <Play className="w-5 h-5 fill-white" />
              <span>Start Sound Game (শব্দ শুনক)</span>
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {message && (
              <div className="p-3.5 rounded-xl bg-[#ff5a00]/15 border border-[#ff5a00]/30 text-white font-medium text-sm animate-pulse">
                {message}
              </div>
            )}

            {/* Instrument Buttons Grid */}
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
              {INSTRUMENTS.map((inst) => (
                <button
                  key={inst.id}
                  onClick={() => handleTileClick(inst.id)}
                  disabled={isPlayingSeq}
                  className={`p-6 rounded-2xl border border-white/10 bg-gradient-to-br ${inst.color} text-white flex flex-col items-center justify-center space-y-2 transform transition-all active:scale-95 shadow-lg hover:border-white/40 ${
                    isPlayingSeq ? 'opacity-70 cursor-not-allowed' : 'hover:scale-[1.02]'
                  }`}
                >
                  <span className="text-5xl">{inst.icon}</span>
                  <span className="text-sm font-bold block">{inst.name}</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => startNewRound(level)}
              disabled={isPlayingSeq}
              className="text-xs text-slate-400 hover:text-white underline pt-2 block mx-auto"
            >
              Replay Sound Sequence (পুনৰ শুনক)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
