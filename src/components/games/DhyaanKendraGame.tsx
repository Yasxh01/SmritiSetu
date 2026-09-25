import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { ArrowLeft, CheckCircle2, RotateCcw, Sparkles } from 'lucide-react';
import { audio } from '../../services/audioService';
import { offlineService } from '../../services/offlineStore';
import { Language, translations } from '../../services/i18n';
import { processGameplayTelemetry } from '../../ml/bridge';
import { meloStore } from '../../services/meloStore';

const FaceMesh = (window as any).FaceMesh;
const Camera = (window as any).Camera;


interface Item {
  id: number;
  type: 'golden_tips' | 'green_leaf' | 'stone';
  label: string;
  icon: string;
}

interface DhyaanKendraGameProps {
  onBack: () => void;
  currentLang?: Language;
}

export const DhyaanKendraGame: React.FC<DhyaanKendraGameProps> = ({ onBack, currentLang = 'en' }) => {
  const t = translations[currentLang];

  const getInitialItems = (): Item[] => [
    { id: 1, type: 'golden_tips', label: t.goldenTip, icon: '🍃' },
    { id: 2, type: 'green_leaf', label: t.greenLeaf, icon: '🌿' },
    { id: 3, type: 'golden_tips', label: t.goldenTip, icon: '🍃' },
    { id: 4, type: 'stone', label: t.pebble, icon: '🪨' },
    { id: 5, type: 'golden_tips', label: t.goldenTip, icon: '🍃' },
  ];

  const [score, setScore] = useState(0);
  const [items, setItems] = useState<Item[]>(getInitialItems);
  const [targetType, setTargetType] = useState<'golden_tips'>('golden_tips');
  const [completed, setCompleted] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const maxFrustrationRef = useRef<number>(0);
  const cameraRef = useRef<any>(null);
  const [cameraEnabled, setCameraEnabled] = useState(false);

  useEffect(() => {
    const startTelemetry = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setCameraEnabled(true);
        }
      } catch (err) {
        console.warn('Camera access denied for telemetry', err);
      }
    };
    startTelemetry();
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(t => t.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (!cameraEnabled || !videoRef.current) return;
    const faceMesh = new FaceMesh({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
    });
    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    faceMesh.onResults((results: any) => {
      if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        const landmarks = results.multiFaceLandmarks[0];
        const leftEyebrowInner = landmarks[107];
        const rightEyebrowInner = landmarks[336];
        if (leftEyebrowInner && rightEyebrowInner) {
          const dx = leftEyebrowInner.x - rightEyebrowInner.x;
          const dy = leftEyebrowInner.y - rightEyebrowInner.y;
          const dz = leftEyebrowInner.z - rightEyebrowInner.z;
          const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
          const furrowScore = Math.max(0, 0.1 - distance) * 10;
          if (furrowScore > maxFrustrationRef.current) {
            maxFrustrationRef.current = furrowScore;
          }
        }
      }
    });

    const camera = new Camera(videoRef.current, {
      onFrame: async () => {
        if (videoRef.current) {
          await faceMesh.send({ image: videoRef.current });
        }
      },
      width: 640,
      height: 480
    });

    camera.start();
    cameraRef.current = camera;

    return () => {
      camera.stop();
      faceMesh.close();
    };
  }, [cameraEnabled]);

  const handlePick = async (item: Item) => {
    if (item.type === targetType) {
      audio.playSuccessChord();
      setScore((s) => s + 50);
      setItems((prev) => prev.filter((i) => i.id !== item.id));

      if (items.filter((i) => i.type === targetType).length <= 1) {
        setCompleted(true);
        confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });

        try {
          await processGameplayTelemetry(
            'ner-pat-78902-assamese',
            {
              session_id: `dhyaan-${Date.now()}`,
              game_id: 'Dhyaan Kendra',
              completion_time_ms: 1100,
              error_count: 0,
              hesitation_pause_ms: 80,
              audio_voice_latency_ms: 0,
              frustration_index: maxFrustrationRef.current,
            },
            {
              rating: meloStore.getMatrix().sustainedFocus,
              skill_vector: [1.0, 1.0, 1.0, 1.0],
              baseline_latency: { mean: 2000, std: 500 },
              rolling_accuracy: 1.0,
            }
          );
        } catch (err) {
          console.warn('Edge mElo bridge write:', err);
        }

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
    setItems(getInitialItems());
  };

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6 animate-fade-in">
      <video ref={videoRef} style={{ display: 'none' }} playsInline />
      <div className="flex items-center justify-between glass-card p-4 rounded-2xl border border-white/10">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-300 hover:text-white px-3 py-1.5 rounded-xl hover:bg-white/5 text-sm font-semibold transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t.backToGames}</span>
        </button>

        <div className="text-sm font-medium">
          {t.score}: <strong className="text-[#ff7a29]">{score}</strong>
        </div>
      </div>

      <div className="glass-card p-8 rounded-3xl border border-white/10 text-center space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            {t.dhyaanTitle}
          </h2>
          <p className="text-slate-300 text-sm max-w-md mx-auto">
            {t.dhyaanDesc}
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
            <h3 className="text-2xl font-bold text-white">{t.teaSortComplete}</h3>
            <p className="text-slate-400 text-sm">{t.teaSortPraise}</p>
            <button onClick={resetGame} className="btn-primary px-8 py-3 text-sm font-bold mx-auto">
              {t.playAgain}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
