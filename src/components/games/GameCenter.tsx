import React, { useState, useEffect } from 'react';
import { Brain, Play, Sparkles, Volume2, Shield, Award, Mic, VolumeX } from 'lucide-react';
import { SmritiMandirGame } from './SmritiMandirGame';
import { DhwaniTarangGame } from './DhwaniTarangGame';
import { DhyaanKendraGame } from './DhyaanKendraGame';
import { DainikDinlipiGame } from './DainikDinlipiGame';
import { audio } from '../../services/audioService';
import { Language, translations } from '../../services/i18n';
import { meloStore, CognitiveSkillMatrix } from '../../services/meloStore';

interface GameCenterProps {
  currentLang?: Language;
}

export const GameCenter: React.FC<GameCenterProps> = ({ currentLang = 'en' }) => {
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [isVoiceSpeaking, setIsVoiceSpeaking] = useState(false);
  const [skillMatrix, setSkillMatrix] = useState<CognitiveSkillMatrix>(() => meloStore.getMatrix());

  useEffect(() => {
    setSkillMatrix(meloStore.getMatrix());

    const handleUpdate = () => {
      setSkillMatrix(meloStore.getMatrix());
    };

    window.addEventListener('melo_matrix_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('melo_matrix_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [activeGame]);


  const t = translations[currentLang];

  const games = [
    {
      id: 'smriti_mandir',
      title: t.smritiTitle,
      domain: t.visualMemory,
      icon: '🏛️',
      gradient: 'from-orange-500/20 to-amber-500/10',
      border: 'hover:border-[#ff5a00]',
      description: t.smritiDesc,
      tier: 'Adaptive',
      badge: t.visualMemory,
    },
    {
      id: 'dhwani_tarang',
      title: t.dhwaniTitle,
      domain: t.auditoryRhythm,
      icon: '🎵',
      gradient: 'from-amber-500/20 to-yellow-500/10',
      border: 'hover:border-amber-400',
      description: t.dhwaniDesc,
      tier: 'Adaptive',
      badge: t.auditoryRhythm,
    },
    {
      id: 'dhyaan_kendra',
      title: t.dhyaanTitle,
      domain: t.sustainedFocus,
      icon: '🍃',
      gradient: 'from-emerald-500/20 to-teal-500/10',
      border: 'hover:border-emerald-400',
      description: t.dhyaanDesc,
      tier: 'Adaptive',
      badge: t.sustainedFocus,
    },
    {
      id: 'dainik_dinlipi',
      title: t.dinlipiTitle,
      domain: t.routineRecall,
      icon: '☀️',
      gradient: 'from-sky-500/20 to-blue-500/10',
      border: 'hover:border-sky-400',
      description: t.dinlipiDesc,
      tier: 'Adaptive',
      badge: t.routineRecall,
    },
  ];

  const handleSpeakWelcome = () => {
    setIsVoiceSpeaking(true);
    const greetings: Partial<Record<Language, string>> = {
      en: 'Welcome! Please select a cognitive exercise to begin.',
      hi: 'नमस्ते! अपनी पसंद का दिमागी खेल शुरू करें।',
      as: 'নমস্কাৰ! আপোনাৰ পছন্দৰ মগজুৰ খেল আৰম্ভ কৰক।',
      bn: 'নমস্কার! আপনার পছন্দের ব্রেন গেম শুরু করুন।',
      brx: 'खुलुमबाय! नोंथांनि मोजां मोननाय गेलेनायखौ जागायदो।',
    };
    audio.speak(greetings[currentLang] || greetings.en, currentLang);
    setTimeout(() => setIsVoiceSpeaking(false), 3000);
  };

  if (activeGame === 'smriti_mandir') {
    return <SmritiMandirGame currentLang={currentLang} onBack={() => setActiveGame(null)} />;
  }
  if (activeGame === 'dhwani_tarang') {
    return <DhwaniTarangGame currentLang={currentLang} onBack={() => setActiveGame(null)} />;
  }
  if (activeGame === 'dhyaan_kendra') {
    return <DhyaanKendraGame currentLang={currentLang} onBack={() => setActiveGame(null)} />;
  }
  if (activeGame === 'dainik_dinlipi') {
    return <DainikDinlipiGame currentLang={currentLang} onBack={() => setActiveGame(null)} />;
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-8 space-y-8 animate-fade-in">
      {/* Hero Welcome Banner */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl border border-white/10 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-3 z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ff5a00]/15 border border-[#ff5a00]/30 text-[#ff7a29] text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Dynamic Difficulty (mElo {skillMatrix.overallRating}+) Active</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            {t.gameHubTitle}<br />
            <span className="text-slate-400 text-lg sm:text-xl font-medium block mt-1">
              {t.gameHubSub}
            </span>
          </h1>

          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
            {t.gameHubDesc}
          </p>

          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={handleSpeakWelcome}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 flex items-center gap-2"
            >
              <Volume2 className="w-4 h-4 text-[#ff5a00]" />
              <span>{t.voiceGuide}</span>
            </button>
          </div>
        </div>

        {/* 4D Cognitive Skill Matrix Preview */}
        <div className="glass-card p-5 rounded-2xl border border-white/5 w-full md:w-72 space-y-3 shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-bold block">
              {t.skillMatrixTitle}
            </span>
            <span className="text-[10px] text-emerald-400 font-mono font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Telemetry
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>{t.visualMemory}</span>
                <span className="font-bold text-[#ff7a29] font-mono">{skillMatrix.visualMemory}</span>
              </div>
              <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-[#ff5a00] h-full rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${Math.min(100, Math.max(8, Math.round(skillMatrix.visualMemory / 10)))}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>{t.auditoryRhythm}</span>
                <span className="font-bold text-amber-400 font-mono">{skillMatrix.auditoryRhythm}</span>
              </div>
              <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-amber-400 h-full rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${Math.min(100, Math.max(8, Math.round(skillMatrix.auditoryRhythm / 10)))}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>{t.sustainedFocus}</span>
                <span className="font-bold text-emerald-400 font-mono">{skillMatrix.sustainedFocus}</span>
              </div>
              <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-400 h-full rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${Math.min(100, Math.max(8, Math.round(skillMatrix.sustainedFocus / 10)))}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>{t.routineRecall}</span>
                <span className="font-bold text-sky-400 font-mono">{skillMatrix.routineRecall}</span>
              </div>
              <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-sky-400 h-full rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${Math.min(100, Math.max(8, Math.round(skillMatrix.routineRecall / 10)))}%` }}
                />
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* 4 Games Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {games.map((game) => (
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
                <span>{t.zeroDelay}</span>
              </span>

              <button className="px-5 py-2 rounded-full bg-[#ff5a00] group-hover:bg-[#ff7a29] text-white text-xs font-bold flex items-center gap-1.5 shadow-glow-orange transition-all">
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>{t.playActivity}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
