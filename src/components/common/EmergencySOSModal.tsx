import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, PhoneCall, MapPin, CheckCircle2, X } from 'lucide-react';

import { api } from '../../services/api';
import { audio } from '../../services/audioService';
import { Language, translations } from '../../services/i18n';
import { SmsDispatchModal } from './SmsDispatchModal';

interface EmergencySOSModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientName?: string;
  currentLang?: Language;
}

export const EmergencySOSModal: React.FC<EmergencySOSModalProps> = ({
  isOpen,
  onClose,
  patientName = 'Bonti Aita',
  currentLang = 'en',
}) => {
  const [countdown, setCountdown] = useState(3);
  const [dispatched, setDispatched] = useState(false);
  const [coords, setCoords] = useState({ lat: 26.1445, lng: 91.7362 }); // Guwahati, Assam
  const [showSmsPreview, setShowSmsPreview] = useState(false);

  const t = translations[currentLang];

  useEffect(() => {
    if (!isOpen) {
      setCountdown(3);
      setDispatched(false);
      return;
    }

    // Attempt HTML5 Geolocation
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {}
      );
    }

    // 3-second countdown safety cancel window
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          triggerEmergencyDispatch();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  const triggerEmergencyDispatch = async () => {
    setDispatched(true);
    audio.playPluck(880);

    try {
      await api.triggerSos({
        patient_id: 'ner-pat-78902-assamese',
        gps_coordinates: coords,
        trigger_source: 'patient_one_touch',
      });
    } catch (e) {
      console.error(e);
    }
  };

  if (!isOpen) return null;
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[90000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !dispatched) onClose();
      }}
    >
      <div
        className="glass-card w-full max-w-lg rounded-3xl p-6 sm:p-8 border border-red-500/30 shadow-[0_0_50px_rgba(239,68,68,0.3)] relative"
        onClick={(e) => e.stopPropagation()}
      >

        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-500 animate-bounce">
            <AlertTriangle className="w-10 h-10 stroke-[2.5]" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            {t.sosTitle}
          </h2>

          {!dispatched ? (
            <div className="space-y-4 py-2">
              <p className="text-slate-300 text-sm">
                {t.sosDispatching}
              </p>
              <div className="text-5xl font-black text-red-500 tracking-wider">
                {countdown}s
              </div>
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold text-sm border border-white/20"
              >
                {t.cancelDispatch}
              </button>
            </div>
          ) : (
            <div className="space-y-5 py-2 w-full">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-left">
                <CheckCircle2 className="w-7 h-7 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-sm font-bold text-emerald-400">
                    {t.alertDispatched}
                  </div>
                  <div className="text-xs text-slate-300">
                    {t.alertDispatchedSub}
                  </div>
                </div>
              </div>

              {/* GPS Coordinates display */}
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-slate-400">
                  <MapPin className="w-4 h-4 text-[#ff5a00]" />
                  {t.gpsCoords}
                </span>
                <span className="font-mono text-slate-200">
                  {coords.lat.toFixed(4)}° N, {coords.lng.toFixed(4)}° E (Kamrup, Assam)
                </span>
              </div>

              {/* Direct call emergency services */}
              <a
                href="tel:108"
                className="w-full py-3.5 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg transition-all"
              >
                <PhoneCall className="w-5 h-5" />
                <span>{t.call108}</span>
              </a>

              {/* Official SMS Handset Preview Button */}
              <button
                type="button"
                onClick={() => setShowSmsPreview(true)}
                className="w-full py-3 rounded-2xl bg-[#ff5a00]/20 hover:bg-[#ff5a00]/30 border border-[#ff5a00]/40 text-[#ff7a29] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-glow-orange cursor-pointer"
              >
                <span>📱 View Dispatched Gateway SMS</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <SmsDispatchModal
        isOpen={showSmsPreview}
        onClose={() => setShowSmsPreview(false)}
        currentLang={currentLang}
        initialEvent="sos"
      />
    </div>,
    document.body
  );
};

