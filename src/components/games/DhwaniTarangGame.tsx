import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { ArrowLeft, Play, Volume2, RotateCcw, CheckCircle2, Trophy, Sparkles, Music2, Ear, HelpCircle } from 'lucide-react';
import { audio } from '../../services/audioService';
import { offlineService } from '../../services/offlineStore';
import { Language, translations } from '../../services/i18n';

interface DhwaniTarangGameProps {
  onBack: () => void;
  currentLang?: Language;
}

export const DhwaniTarangGame: React.FC<DhwaniTarangGameProps> = ({ onBack, currentLang = 'en' }) => {
  const [sequence, setSequence] = useState<string[]>([]);
  const [playerInput, setPlayerInput] = useState<string[]>([]);
  const [gameState, setGameState] = useState<'idle' | 'listening' | 'playerTurn'>('idle');
  const [activeInstrumentId, setActiveInstrumentId] = useState<string | null>(null);
  const [activeStepIndex, setActiveStepIndex] = useState<number | null>(null);
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const timeoutIdsRef = useRef<NodeJS.Timeout[]>([]);

  const t = translations[currentLang];

  const instruments = [
    {
      id: 'dhol',
      name: t.dholName || 'Bihu Dhol',
      icon: '🥁',
      subtitle: 'Traditional Assam Folk Drum',
      color: 'from-amber-600 to-amber-900 border-amber-500/40',
      activeColor: 'ring-4 ring-amber-400 bg-amber-600/50 shadow-[0_0_35px_rgba(245,158,11,0.7)] scale-105',
    },
    {
      id: 'tokari',
      name: t.tokariName || 'Tokari String',
      icon: '🪕',
      subtitle: 'Assam Folk Plucked Lute',
      color: 'from-orange-600 to-orange-900 border-orange-500/40',
      activeColor: 'ring-4 ring-orange-400 bg-orange-600/50 shadow-[0_0_35px_rgba(249,115,22,0.7)] scale-105',
    },
    {
      id: 'rain',
      name: t.rainName || 'Monsoon Rain',
      icon: '🌧️',
      subtitle: 'Gentle Calming Raindrops',
      color: 'from-sky-600 to-sky-900 border-sky-500/40',
      activeColor: 'ring-4 ring-sky-400 bg-sky-600/50 shadow-[0_0_35px_rgba(14,165,233,0.7)] scale-105',
    },
    {
      id: 'flute',
      name: t.fluteName || 'Bamboo Flute',
      icon: '🪈',
      subtitle: 'Sweet High Bamboo Melody',
      color: 'from-emerald-600 to-emerald-900 border-emerald-500/40',
      activeColor: 'ring-4 ring-emerald-400 bg-emerald-600/50 shadow-[0_0_35px_rgba(16,185,129,0.7)] scale-105',
    },
  ];

  // Clear timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutIdsRef.current.forEach(clearTimeout);
    };
  }, []);

  const playInstrumentSound = (id: string) => {
    if (id === 'dhol') audio.playDholBeat(true);
    else if (id === 'tokari') audio.playPluck(380);
    else if (id === 'rain') audio.playCalmingTone();
    else if (id === 'flute') audio.playPluck(680);
  };

  const triggerInstrumentVisualAndSound = (id: string, duration = 650) => {
    playInstrumentSound(id);
    setActiveInstrumentId(id);
    const tid = setTimeout(() => {
      setActiveInstrumentId(null);
    }, duration);
    timeoutIdsRef.current.push(tid);
  };

  // Play sequence with visual and audio synchronization
  const playSequence = (seq: string[]) => {
    timeoutIdsRef.current.forEach(clearTimeout);
    timeoutIdsRef.current = [];

    setGameState('listening');
    setPlayerInput([]);
    setMessage(t.listenCarefully || '🎧 Listen carefully! Watch the instruments light up...');
    setActiveInstrumentId(null);
    setActiveStepIndex(null);

    const stepInterval = 950; // Gentle pace for dementia accessibility

    seq.forEach((itemId, idx) => {
      const stepStart = setTimeout(() => {
        setActiveStepIndex(idx);
        triggerInstrumentVisualAndSound(itemId, 700);
      }, (idx + 1) * stepInterval);

      timeoutIdsRef.current.push(stepStart);
    });

    // When sequence finishes playing
    const endTid = setTimeout(() => {
      setActiveStepIndex(null);
      setActiveInstrumentId(null);
      setGameState('playerTurn');
      setMessage(t.yourTurnTap || '👉 Your Turn! Tap the instruments in the exact order you heard.');
    }, (seq.length + 1) * stepInterval);

    timeoutIdsRef.current.push(endTid);
  };

  const startNewRound = (targetLevel = level) => {
    setIsSuccess(false);
    // Level 1 = 2 notes, Level 2 = 3 notes, Level 3+ = 4 notes (capped to avoid cognitive overwhelm)
    const seqLen = Math.min(4, Math.max(2, targetLevel + 1));
    const pool = ['dhol', 'tokari', 'rain', 'flute'];
    const newSeq: string[] = [];

    for (let i = 0; i < seqLen; i++) {
      newSeq.push(pool[Math.floor(Math.random() * pool.length)]);
    }

    setSequence(newSeq);
    playSequence(newSeq);
  };

  // Handle player tapping an instrument
  const handleInstrumentClick = async (id: string) => {
    // In idle / practice mode before game starts, elder can tap freely to hear the sounds
    if (gameState === 'idle') {
      triggerInstrumentVisualAndSound(id, 600);
      return;
    }

    if (gameState !== 'playerTurn') return;

    // Trigger sound and brief glow
    triggerInstrumentVisualAndSound(id, 450);

    const updated = [...playerInput, id];
    setPlayerInput(updated);

    const currentIndex = updated.length - 1;

    // Check if tapped instrument matches the sequence at this position
    if (updated[currentIndex] !== sequence[currentIndex]) {
      setMessage(t.soundTryAgain || 'Try again calmly, no worries!');
      audio.playCalmingTone();

      // Automatically replay the sequence after a gentle delay so the patient can hear it again
      const retryTid = setTimeout(() => {
        playSequence(sequence);
      }, 1600);
      timeoutIdsRef.current.push(retryTid);
      return;
    }

    // Check if full sequence completed
    if (updated.length === sequence.length) {
      setIsSuccess(true);
      audio.playSuccessChord();
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.65 } });
      setMessage(t.brilliantRhythm || 'Brilliant rhythm memory!');
      setScore((s) => s + 100);

      // Record telemetry for analytics
      await offlineService.recordTelemetry({
        patient_id: 'ner-pat-78902-assamese',
        session_id: `dhwani-${Date.now()}`,
        game_id: 'dhwani_tarang',
        completion_time_ms: 1250,
        error_count: 0,
        hesitation_pause_ms: 100,
        timestamp: new Date().toISOString(),
      });

      const nextLevelTid = setTimeout(() => {
        const nextLvl = level + 1;
        setLevel(nextLvl);
        startNewRound(nextLvl);
      }, 2000);
      timeoutIdsRef.current.push(nextLevelTid);
    }
  };

  const getInstrumentObj = (id: string) => instruments.find((i) => i.id === id);

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6 animate-fade-in">
      {/* Top Header Card */}
      <div className="flex items-center justify-between glass-card p-4 sm:p-5 rounded-2xl border border-white/10 shadow-lg">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-300 hover:text-white px-3 py-1.5 rounded-xl hover:bg-white/5 text-sm font-semibold transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t.backToGames}</span>
        </button>

        <div className="flex items-center gap-6 text-sm font-medium">
          <div className="flex items-center gap-1.5 bg-black/40 px-3 py-1 rounded-xl border border-white/5">
            <span className="text-slate-400 text-xs">{t.level}:</span>
            <strong className="text-white text-base">{level}</strong>
          </div>
          <div className="flex items-center gap-1.5 bg-black/40 px-3 py-1 rounded-xl border border-white/5">
            <Trophy className="w-4 h-4 text-[#ff7a29]" />
            <span className="text-slate-400 text-xs">{t.score}:</span>
            <strong className="text-[#ff7a29] text-base">{score}</strong>
          </div>
        </div>
      </div>

      {/* Main Sound Stage */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl border border-white/10 text-center space-y-6 shadow-2xl relative overflow-hidden">
        {/* Soft Background Accent */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-[#ff5a00]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Title & Instructions */}
        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ff5a00]/15 text-[#ff7a29] border border-[#ff5a00]/30 text-xs font-bold uppercase tracking-wider">
            <Music2 className="w-3.5 h-3.5" />
            <span>Auditory Rhythm Memory • LOINC 72172-0</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {t.dhwaniTitle}
          </h2>
          <p className="text-slate-300 text-sm max-w-xl mx-auto leading-relaxed">
            {t.dhwaniDesc}
          </p>
        </div>

        {/* Dynamic Status / Step Banner */}
        {gameState !== 'idle' && (
          <div
            className={`p-4 rounded-2xl border text-sm font-bold flex items-center justify-center gap-3 transition-all ${
              gameState === 'listening'
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-200 animate-pulse'
                : isSuccess
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-200'
                : 'bg-[#ff5a00]/20 border-[#ff5a00]/40 text-white'
            }`}
          >
            {gameState === 'listening' ? (
              <Ear className="w-5 h-5 text-amber-400 animate-bounce" />
            ) : isSuccess ? (
              <Sparkles className="w-5 h-5 text-emerald-400" />
            ) : (
              <Volume2 className="w-5 h-5 text-[#ff7a29]" />
            )}
            <span>{message}</span>
          </div>
        )}

        {/* Sequence Progress Tracker (Visible when game active) */}
        {gameState !== 'idle' && sequence.length > 0 && (
          <div className="bg-black/50 p-4 rounded-2xl border border-white/10 space-y-2 max-w-md mx-auto">
            <div className="flex items-center justify-between text-xs text-slate-400 px-1 font-semibold">
              <span>{gameState === 'listening' ? (t.playingStep || 'Playing Note') : (t.yourTap || 'Your Progress')}:</span>
              <span>
                {gameState === 'listening'
                  ? `${(activeStepIndex ?? 0) + 1} / ${sequence.length}`
                  : `${playerInput.length} / ${sequence.length}`}
              </span>
            </div>

            {/* Sequence Slot Dots */}
            <div className="flex items-center justify-center gap-3 py-1">
              {sequence.map((item, idx) => {
                const targetInst = getInstrumentObj(item);
                const isCurrentPlaying = gameState === 'listening' && activeStepIndex === idx;
                const isPlayerDone = gameState === 'playerTurn' && idx < playerInput.length;
                const isPlayerNext = gameState === 'playerTurn' && idx === playerInput.length;

                return (
                  <div
                    key={idx}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                      isCurrentPlaying
                        ? 'bg-amber-500/30 border-amber-400 text-amber-200 scale-110 shadow-[0_0_20px_rgba(245,158,11,0.6)]'
                        : isPlayerDone
                        ? 'bg-emerald-500/25 border-emerald-400 text-emerald-300'
                        : isPlayerNext
                        ? 'bg-[#ff5a00]/20 border-[#ff5a00] text-white animate-pulse'
                        : 'bg-white/5 border-white/10 text-slate-500'
                    }`}
                  >
                    <span>{idx + 1}.</span>
                    {/* In listening mode, reveal what is playing. In player turn, reveal what player has tapped */}
                    {isCurrentPlaying ? (
                      <span>{targetInst?.icon} {targetInst?.name}</span>
                    ) : isPlayerDone ? (
                      <span>{getInstrumentObj(playerInput[idx])?.icon} ✓</span>
                    ) : isPlayerNext ? (
                      <span>? Tap next</span>
                    ) : (
                      <span>...</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Practice Mode Hint (When Idle) */}
        {gameState === 'idle' && (
          <div className="p-3.5 bg-white/5 border border-white/10 rounded-2xl max-w-lg mx-auto text-xs text-slate-300 flex items-center justify-center gap-2">
            <Volume2 className="w-4 h-4 text-[#ff7a29]" />
            <span>{t.tryInstrumentBefore || '🎵 Practice: Tap any instrument below to hear its sound before starting:'}</span>
          </div>
        )}

        {/* Big Instrument Buttons Grid (Dementia-Friendly, Clear Visual Lighting) */}
        <div className="grid grid-cols-2 gap-4 sm:gap-6 max-w-lg mx-auto">
          {instruments.map((inst) => {
            const isActive = activeInstrumentId === inst.id;
            const isDisabled = gameState === 'listening';

            return (
              <button
                key={inst.id}
                onClick={() => handleInstrumentClick(inst.id)}
                disabled={isDisabled}
                className={`group relative p-6 sm:p-7 rounded-3xl border text-white flex flex-col items-center justify-center space-y-3 transition-all duration-300 ${
                  inst.color
                } ${
                  isActive ? inst.activeColor : 'hover:border-white/30 hover:scale-[1.02]'
                } ${isDisabled ? 'cursor-not-allowed opacity-90' : 'cursor-pointer active:scale-95'}`}
              >
                {/* Active Glowing Sound Wave Indicator */}
                {isActive && (
                  <div className="absolute -top-3 px-3 py-0.5 rounded-full bg-white text-black font-extrabold text-[11px] flex items-center gap-1 shadow-lg animate-bounce">
                    <Volume2 className="w-3.5 h-3.5 text-[#ff5a00]" />
                    <span>Sound Playing!</span>
                  </div>
                )}

                <span className={`text-6xl sm:text-7xl transition-transform duration-200 ${isActive ? 'scale-125' : 'group-hover:scale-110'}`}>
                  {inst.icon}
                </span>

                <div className="text-center">
                  <span className="text-base sm:text-lg font-bold block tracking-tight">
                    {inst.name}
                  </span>
                  <span className="text-[11px] text-white/70 block mt-0.5 font-medium">
                    {inst.subtitle}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Action Controls */}
        <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
          {gameState === 'idle' ? (
            <button
              onClick={() => startNewRound(1)}
              className="btn-primary px-10 py-4 text-base font-extrabold flex items-center justify-center gap-2.5 mx-auto shadow-glow-orange hover:scale-105 transition-transform"
            >
              <Play className="w-5 h-5 fill-white" />
              <span>{t.startSoundGame}</span>
            </button>
          ) : (
            <button
              onClick={() => playSequence(sequence)}
              disabled={gameState === 'listening'}
              className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 transition-all border border-white/15 disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4 text-[#ff7a29]" />
              <span>{t.listenAgain || '👂 Listen Again'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
