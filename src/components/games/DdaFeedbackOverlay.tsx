import React from 'react';
import { Heart, Sparkles, Volume2, Shield } from 'lucide-react';
import { audio } from '../../services/audioService';
import { Language, translations } from '../../services/i18n';

interface DdaFeedbackOverlayProps {
  isOpen: boolean;
  onDismiss: () => void;
  currentLang?: Language;
}

export const DdaFeedbackOverlay: React.FC<DdaFeedbackOverlayProps> = ({
  isOpen,
  onDismiss,
  currentLang = 'en',
}) => {
  if (!isOpen) return null;

  const t = translations[currentLang];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-lg animate-fade-in">
      <div className="glass-card max-w-md w-full rounded-3xl p-8 border border-[#ff5a00]/30 shadow-glow-orange-lg text-center space-y-6">
        {/* Pulsing gentle heart/lotus icon */}
        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-tr from-[#ff5a00]/20 to-[#ff9e00]/20 border border-[#ff5a00]/40 flex items-center justify-center animate-pulse">
          <Heart className="w-10 h-10 text-[#ff7a29] fill-[#ff5a00]/40" />
        </div>

        <div className="space-y-2">
          <span className="text-xs uppercase tracking-widest text-[#ff7a29] font-bold">
            {t.anxietyBadge}
          </span>
          <h3 className="text-2xl font-bold text-white">
            {t.anxietyTitle}
          </h3>
          <p className="text-slate-300 text-sm leading-relaxed">
            {t.anxietyDesc}
          </p>
        </div>

        {/* Soothing audio prompt button */}
        <button
          onClick={() => audio.playCalmingTone()}
          className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-300 flex items-center justify-center gap-2 mx-auto"
        >
          <Volume2 className="w-4 h-4 text-[#ff5a00]" />
          <span>{t.playCalmChime}</span>
        </button>

        <button
          onClick={onDismiss}
          className="btn-primary w-full py-3.5 text-sm font-bold tracking-wide"
        >
          {t.continueRelaxed}
        </button>
      </div>
    </div>
  );
};
