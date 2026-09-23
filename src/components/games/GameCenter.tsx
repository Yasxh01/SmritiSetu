import React, { useState } from 'react';
import { Brain, Play, Sparkles, Volume2, Shield, Award, Mic, VolumeX } from 'lucide-react';
import { SmritiMandirGame } from './SmritiMandirGame';
import { DhwaniTarangGame } from './DhwaniTarangGame';
import { DhyaanKendraGame } from './DhyaanKendraGame';
import { DainikDinlipiGame } from './DainikDinlipiGame';
import { audio } from '../../services/audioService';

const GAMES = [
  {
    id: 'smriti_mandir',
    title: 'স্মৃতি মন্দিৰ (Smriti Mandir)',
    englishTitle: 'Memory Temple',
    domain: 'Visual Memory & Cultural Recognition',
    icon: '🏛️',
    gradient: 'from-orange-500/20 to-amber-500/10',
    border: 'hover:border-[#ff5a00]',
    description: 'Match pairs of sacred North Eastern cultural motifs: Jaapi, Xorai, Gamosa, and Pepa.',
    tier: 'Adaptive',
    badge: 'Visual Memory',
  },
  {
    id: 'dhwani_tarang',
    title: 'ধ্বনি তৰংগ (Dhwani Tarang)',
    englishTitle: 'Sound Waves',
    domain: 'Auditory Attention & Rhythm Recall',
    icon: '🎵',
    gradient: 'from-amber-500/20 to-yellow-500/10',
    border: 'hover:border-amber-400',
    description: 'Listen and repeat sequences of authentic Bihu Dhol beats, Tokari strings, and nature rain.',
    tier: 'Adaptive',
    badge: 'Auditory Memory',
  },
  {
    id: 'dhyaan_kendra',
    title: 'ধ্যান কেন্দ্ৰ (Dhyaan Kendra)',
    englishTitle: 'Focus Center',
    domain: 'Sustained Attention & Categorization',
    icon: '🍃',
    gradient: 'from-emerald-500/20 to-teal-500/10',
    border: 'hover:border-emerald-400',
    description: 'Sort golden tea leaves and distinguish authentic handloom patterns to stimulate focus.',
    tier: 'Adaptive',
    badge: 'Semantic Fluency',
  },
  {
    id: 'dainik_dinlipi',
    title: 'দৈনিক দিনলিপি (Dainik Dinlipi)',
    englishTitle: 'Daily Routine',
    domain: 'Executive Planning & Episodic Recall',
    icon: '☀️',
    gradient: 'from-sky-500/20 to-blue-500/10',
    border: 'hover:border-sky-400',
    description: 'Arrange daily life activities in chronological morning-to-night sequence.',
    tier: 'Adaptive',
    badge: 'Executive Planning',
  },
];

export const GameCenter: React.FC = () => {
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [isVoiceSpeaking, setIsVoiceSpeaking] = useState(false);

  const handleSpeakWelcome = () => {
    setIsVoiceSpeaking(true);
    audio.speak('নমস্কাৰ! আপোনাৰ পছন্দৰ মগজুৰ খেল আৰম্ভ কৰক।', 'as');
    setTimeout(() => setIsVoiceSpeaking(false), 3000);
  };

  if (activeGame === 'smriti_mandir') {
    return <SmritiMandirGame onBack={() => setActiveGame(null)} />;
  }
  if (activeGame === 'dhwani_tarang') {
    return <DhwaniTarangGame onBack={() => setActiveGame(null)} />;
  }
  if (activeGame === 'dhyaan_kendra') {
    return <DhyaanKendraGame onBack={() => setActiveGame(null)} />;
  }
  if (activeGame === 'dainik_dinlipi') {
    return <DainikDinlipiGame onBack={() => setActiveGame(null)} />;
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-8 space-y-8 animate-fade-in">
      {/* Hero Welcome Banner */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl border border-white/10 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-3 z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ff5a00]/15 border border-[#ff5a00]/30 text-[#ff7a29] text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Dynamic Difficulty (mElo 600+) Active</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            মগজুৰ ব্যায়াম আৰু সাংস্কৃতিক খেল<br />
            <span className="text-slate-400 text-lg sm:text-xl font-medium block mt-1">
              Cognitive Wellness Tailored for North East India
            </span>
          </h1>

          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            Choose an activity below. Games automatically adapt in real-time based on your reaction speed, pauses, and comfort level.
          </p>

          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={handleSpeakWelcome}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 flex items-center gap-2"
            >
              <Volume2 className="w-4 h-4 text-[#ff5a00]" />
              <span>Voice Guide (কণ্ঠস্বৰ শুনাওক)</span>
            </button>
          </div>
        </div>

        {/* 4D Cognitive Skill Matrix Preview */}
        <div className="glass-card p-5 rounded-2xl border border-white/5 w-full md:w-72 space-y-3 shrink-0">
          <span className="text-xs uppercase tracking-wider text-slate-400 font-bold block">
            Cognitive Skill Matrix (mElo)
          </span>

          <div className="space-y-2 text-xs">
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Visual Memory</span>
                <span className="font-bold text-[#ff7a29]">640</span>
              </div>
              <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                <div className="bg-[#ff5a00] h-full rounded-full w-[64%]" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Auditory Rhythm</span>
                <span className="font-bold text-amber-400">620</span>
              </div>
              <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                <div className="bg-amber-400 h-full rounded-full w-[62%]" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Sustained Focus</span>
                <span className="font-bold text-emerald-400">610</span>
              </div>
              <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-400 h-full rounded-full w-[61%]" />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Routine Recall</span>
                <span className="font-bold text-sky-400">650</span>
              </div>
              <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                <div className="bg-sky-400 h-full rounded-full w-[65%]" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Games Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {GAMES.map((game) => (
          <div
            key={game.id}
            onClick={() => setActiveGame(game.id)}
            className={`glass-card p-6 sm:p-8 rounded-3xl border border-white/10 ${game.border} transition-all duration-300 hover:scale-[1.01] cursor-pointer group flex flex-col justify-between space-y-5 bg-gradient-to-br ${game.gradient}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  {game.badge}
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-white group-hover:text-[#ff7a29] transition-colors">
                  {game.title}
                </h3>
                <span className="text-xs text-slate-400 block font-medium">
                  {game.domain}
                </span>
              </div>

              <div className="w-14 h-14 rounded-2xl glass-card flex items-center justify-center text-3xl shadow-lg border border-white/10 group-hover:scale-110 transition-transform">
                {game.icon}
              </div>
            </div>

            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              {game.description}
            </p>

            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                <span>Zero UI Delay (&lt;15ms)</span>
              </span>

              <button className="px-5 py-2 rounded-full bg-[#ff5a00] group-hover:bg-[#ff7a29] text-white text-xs font-bold flex items-center gap-1.5 shadow-glow-orange transition-all">
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Play Activity</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
