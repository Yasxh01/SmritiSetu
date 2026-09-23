import React, { useState } from 'react';
import { Smartphone, CheckCircle2, ShieldAlert, MapPin, Send, Clock, Server, ExternalLink, X, AlertTriangle, PhoneCall } from 'lucide-react';
import { audio } from '../../services/audioService';
import { Language } from '../../services/i18n';

export interface SmsDispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLang?: Language;
  initialEvent?: 'sos' | 'anomaly' | 'medication';
}

interface LocalizedEvent {
  title: string;
  badge: string;
  familyMsg: string;
  ashaMsg: string;
  dltTemplateId: string;
}

const localizedEvents: Record<Language, Record<'sos' | 'anomaly' | 'medication', LocalizedEvent>> = {
  en: {
    sos: {
      title: '🚨 Emergency One-Touch SOS Alert',
      badge: 'PRIORITY 1 • CRITICAL',
      familyMsg: `[SmritiSetu EMERGENCY] 🚨 Bonti Aita has triggered an Emergency SOS from Kamrup, Assam (26.1433° N, 91.7898° E). Immediate family assistance requested. Live GPS Map: https://maps.google.com/?q=26.1433,91.7898. Assigned ASHA Worker Anjali Das has been simultaneously dispatched. Local 108 Emergency Ambulance notified.`,
      ashaMsg: `[ASHA PRIORITY 1 DISPATCH] 🚨 Household #42 (Bonti Aita, Kamrup Sub-Centre) triggered SOS. Immediate doorstep home visit required. GPS: 26.1433, 91.7898. Verify vitals & safety. Dial 108 if non-responsive.`,
      dltTemplateId: '1407161234567890123',
    },
    anomaly: {
      title: '⚠️ Algorithmic Cognitive Anomaly Alert (Day 21 CHI Drop)',
      badge: 'CLINICAL ALERT • MODERATE',
      familyMsg: `[SmritiSetu Caregiver Alert] ⚠️ Cognitive Health Index (CHI) for Bonti Aita dropped 23% over the past 48 hours (motor pause latency rose from 1,180ms to 2,420ms). ASHA Worker Anjali Das has been requested for a home check-in. Review clinical station: https://smritisetu.health/p/78902`,
      ashaMsg: `[ASHA Clinical Task] ⚠️ Patient Bonti Aita (Kamrup Rural) showed acute cognitive hesitation in morning session. Please schedule a doorstep MoCA re-screening and verify Donepezil 5mg adherence within 24 hours.`,
      dltTemplateId: '1407168923451239012',
    },
    medication: {
      title: '💊 Missed Medication Reminder Escalation',
      badge: 'ADHERENCE WARNING',
      familyMsg: `[SmritiSetu Reminder] 💊 Morning medicine (Donepezil 5mg) for Bonti Aita has not been confirmed as of 10:30 AM (scheduled 08:30 AM). Please check with patient.`,
      ashaMsg: `[ASHA Pill-Check Alert] 💊 Household #42 unconfirmed morning dose. Please verify during afternoon village round.`,
      dltTemplateId: '1407163345127891234',
    },
  },
  hi: {
    sos: {
      title: '🚨 आपातकालीन वन-टच SOS अलर्ट',
      badge: 'प्राथमिकता 1 • अति गंभीर',
      familyMsg: `[स्मृतिसेतु आपातकालीन अलर्ट] 🚨 बोन्ती आइता ने कामरूप, असम (26.1433° N, 91.7898° E) से आपातकालीन SOS भेजा है। तत्काल पारिवारिक सहायता की आवश्यकता है। लाइव जीपीएस मैप: https://maps.google.com/?q=26.1433,91.7898। आशा कार्यकर्ता अंजलि दास को तुरंत घर पर सत्यापन के लिए सूचित कर दिया गया है। स्थानीय 108 एम्बुलेंस सेवा को भी अलर्ट भेजा गया।`,
      ashaMsg: `[आशा प्राथमिकता 1 अलर्ट] 🚨 घर सं. 42 (बोन्ती आइता, कामरूप उप-केंद्र) से SOS प्राप्त हुआ। तत्काल घर जाकर स्वास्थ्य जांच करें। जीपीएस निर्देशांक: 26.1433, 91.7898। रक्तचाप और स्वास्थ्य स्थिति जांचें। जरूरत पड़ने पर 108 डायल करें।`,
      dltTemplateId: '1407161234567890123',
    },
    anomaly: {
      title: '⚠️ संज्ञानात्मक स्वास्थ्य गिरावट चेतावनी (दिन 21 CHI गिरावट)',
      badge: 'नैदानिक चेतावनी • मध्यम',
      familyMsg: `[स्मृतिसेतु देखभालकर्ता चेतावनी] ⚠️ बोन्ती आइता के संज्ञानात्मक स्वास्थ्य सूचकांक (CHI) में पिछले 48 घंटों में 23% की गिरावट दर्ज की गई है (मोटर विलंबता 1,180ms से बढ़कर 2,420ms हो गई)। आशा कार्यकर्ता अंजलि दास को घर पर जांच के लिए निर्देशित किया गया है। क्लिनिकल स्टेशन देखें: https://smritisetu.health/p/78902`,
      ashaMsg: `[आशा नैदानिक कार्य] ⚠️ मरीज बोन्ती आइता (कामरूप ग्रामीण) में सुबह के सत्र में गंभीर संज्ञानात्मक झिझक देखी गई। कृपया 24 घंटे के भीतर घर पर MoCA पुनः स्क्रीनिंग करें और डोनेपेज़िल 5mg दवा अनुपालन की जांच करें।`,
      dltTemplateId: '1407168923451239012',
    },
    medication: {
      title: '💊 दवा न लेने की सूचना',
      badge: 'दवा अनुपालन चेतावनी',
      familyMsg: `[स्मृतिसेतु दवा स्मरण] 💊 बोन्ती आइता की सुबह की दवा (डोनेपेज़िल 5mg) सुबह 10:30 बजे तक नहीं ली गई है (निर्धारित समय 08:30 AM)। कृपया मरीज से पुष्टि करें।`,
      ashaMsg: `[आशा दवा जांच अलर्ट] 💊 घर सं. 42 में सुबह की दवा की पुष्टि नहीं हुई है। दोपहर के ग्राम भ्रमण के दौरान कृपया सत्यापन करें।`,
      dltTemplateId: '1407163345127891234',
    },
  },
  as: {
    sos: {
      title: '🚨 জৰুৰীকালীন ৱান-টাচ SOS সতৰ্কবাণী',
      badge: 'অগ্ৰাধিকাৰ ১ • গুৰুত্বপূৰ্ণ',
      familyMsg: `[স্মৃতিসেতু জৰুৰী সতৰ্কবাণী] 🚨 বন্তি আইতাই কামৰূপ, অসমৰ পৰা জৰুৰীকালীন SOS প্ৰেৰণ কৰিছে (২৬.১৪৩৩° উত্তৰ, ৯১.৭৮৯৮° পূব)। তাৎক্ষণিক পৰিয়ালৰ সাহায্য প্ৰয়োজন। লাইভ জিপিএছ মেপ: https://maps.google.com/?q=26.1433,91.7898। আশা কৰ্মী অঞ্জলি দাসক অৱগত কৰা হৈছে। স্থানীয় ১০৮ এম্বুলেন্স সতৰ্ক কৰা হৈছে।`,
      ashaMsg: `[আশা অগ্ৰাধিকাৰ ১ বাৰ্তা] 🚨 ঘৰ নং ৪২ (বন্তি আইতা, কামৰূপ উপকেন্দ্ৰ) জৰুৰী SOS বাজি উঠিছে। তৎক্ষণাৎ ঘৰত উপস্থিত হৈ স্বাস্থ্য পৰীক্ষা কৰক। স্থানাংক: ২৬.১৪৩৩, ৯১.৭৮৯৮। ১০৮ ডায়েল কৰক যদি প্ৰয়োজন হয়।`,
      dltTemplateId: '1407161234567890123',
    },
    anomaly: {
      title: '⚠️ স্মৃতিশক্তিৰ অস্বাভাৱিক অৱনতি (২১ দিনৰ CHI হ্ৰাস)',
      badge: 'ক্লিনিকেল সতৰ্কবাণী',
      familyMsg: `[স্মৃতিসেতু পৰিচৰ্যা সতৰ্কবাণী] ⚠️ বন্তি আইতাৰ যোৱা ৪৮ ঘণ্টাত স্মৃতি সূচকাংকত ২৩% অৱনতি ঘটিছে। আশা কৰ্মী অঞ্জলি দাসক গৃহ পৰিদৰ্শনৰ বাবে অনুৰোধ জনোৱা হৈছে। ৰিপৰ্ট চাওক: https://smritisetu.health/p/78902`,
      ashaMsg: `[আশা স্বাস্থ্য কৰ্তব্য] ⚠️ ৰোগী বন্তি আইতাৰ পুৱাৰ খেলত অধিক সময় লোৱা দেখা গৈছে। অনুগ্ৰহ কৰি ২৪ ঘণ্টাৰ ভিতৰত MoCA পৰীক্ষা কৰক আৰু ডনেপেজিল ঔষধ গ্ৰহণ পৰীক্ষা কৰক।`,
      dltTemplateId: '1407168923451239012',
    },
    medication: {
      title: '💊 সময়মতে ঔষধ নোখোৱাৰ সতৰ্কবাণী',
      badge: 'ঔষধ গ্ৰহণ অনুসূচী',
      familyMsg: `[স্মৃতিসেতু ঔষধ সোঁৱৰণী] 💊 বন্তি আইতাৰ পুৱাৰ ঔষধ (ডনেপেজিল ৫মি:গ্ৰা:) পুৱা ১০:৩০ বজালৈকে খোৱা হোৱা নাই। অনুগ্ৰহ কৰি খবৰ লওক।`,
      ashaMsg: `[আশা ঔষধ নিৰীক্ষণ] 💊 ঘৰ নং ৪২ পুৱাৰ ঔষধ নিশ্চিত হোৱা নাই। দুপৰীয়াৰ ভ্ৰমণৰ সময়ত পৰীক্ষা কৰক।`,
      dltTemplateId: '1407163345127891234',
    },
  },
  bn: {
    sos: {
      title: '🚨 জরুরি ওয়ান-টাচ SOS সতর্কতা',
      badge: 'অগ্রাধিকার ১ • জরুরি',
      familyMsg: `[স্মৃতিসেতু জরুরি বার্তা] 🚨 বন্তি আইতা কামরূপ, আসাম থেকে জরুরি SOS পাঠিয়েছেন (২৬.১৪৩৩° উ, ৯১.৭৮৯৮° পূ)। অবিলম্বে পারিবারিক সাহায্য প্রয়োজন। লাইভ ম্যাপ: https://maps.google.com/?q=26.1433,91.7898। আশা কর্মী অঞ্জলি দাসকে সতর্ক করা হয়েছে। ১০৮ অ্যাম্বুলেন্সকে জানানো হয়েছে।`,
      ashaMsg: `[আশা অগ্রাধিকার ১ বার্তা] 🚨 বাড়ি নং ৪২ (বন্তি আইতা, কামরূপ উপকেন্দ্র) জরুরি SOS পাঠিয়েছেন। অবিলম্বে বাড়ি গিয়ে অবস্থা পরীক্ষা করুন। স্থানাঙ্ক: ২৬.১৪৩৩, ৯১.৭৮৯৮।`,
      dltTemplateId: '1407161234567890123',
    },
    anomaly: {
      title: '⚠️ স্মৃতিশক্তি হ্রাসের সতর্কতা (দিন ২১ সূচক পতন)',
      badge: 'ক্লিনিক্যাল সতর্কতা',
      familyMsg: `[স্মৃতিসেতু যত্নকারী সতর্কতা] ⚠️ বন্তি আইতার গত ৪৮ ঘণ্টায় কগনিটিভ সূচক ২৩% হ্রাস পেয়েছে। আশা কর্মী অঞ্জলি দাসকে বাড়ি যাওয়ার অনুরোধ করা হয়েছে। দেখুন: https://smritisetu.health/p/78902`,
      ashaMsg: `[আশা দায়িত্ব] ⚠️ রোগী বন্তি আইতার সকালের সেশনে অস্বাভাবিক বিলম্ব লক্ষ্য করা গেছে। ২৪ ঘণ্টার মধ্যে MoCA পরীক্ষা করুন।`,
      dltTemplateId: '1407168923451239012',
    },
    medication: {
      title: '💊 ওষুধ সেবনের অনুস্মারক',
      badge: 'ওষুধ সতর্কতা',
      familyMsg: `[স্মৃতিসেতু ওষুধ অনুস্মারক] 💊 বন্তি আইতার সকালের ওষুধ (ডনেপেজিল ৫মিগ্রা) সকাল ১০:৩০ পর্যন্ত নেওয়া হয়নি। অনুগ্রহ করে খোঁজ নিন।`,
      ashaMsg: `[আশা ওষুধ পরীক্ষা] 💊 বাড়ি নং ৪২ সকালের ওষুধ নেওয়া হয়নি। বিকেলে পরিদর্শনের সময় যাচাই করুন।`,
      dltTemplateId: '1407163345127891234',
    },
  },
  brx: {
    sos: {
      title: '🚨 गोनांथार 1-थाव SOS खौरां',
      badge: 'आग्रा 1 • गोनांथार',
      familyMsg: `[स्मृतीसेतु गोनांथार खौरां] 🚨 बोन्ती आइता कामरुप, आसामनिफ्राय गोनांथार SOS हरबाय (26.1433° N, 91.7898° E)। अननानै लोगो हम। जीपीएस मेप: https://maps.google.com/?q=26.1433,91.7898। आशा कर्मी अनजलि दासखौ खौरां हरबाय। 108 एम्बुलेन्सखौबो खौरां हरबाय।`,
      ashaMsg: `[आशा आग्रा 1 खौरां] 🚨 न' नं 42 (बोन्ती आइता) निफ्राय SOS जाबाय। न'सिम थांनानै नाय। जीपीएस: 26.1433, 91.7898।`,
      dltTemplateId: '1407161234567890123',
    },
    anomaly: {
      title: '⚠️ गोसोखांनाय खम जानायनि खौरां',
      badge: 'सावस्रि खौरां',
      familyMsg: `[स्मृतीसेतु खौरां] ⚠️ बोन्ती आइतानि गोसोखांनाय 23% खम जाबाय। आशा कर्मिया न'सिम थांगोन।`,
      ashaMsg: `[आशा खामानि] ⚠️ बोन्ती आइताखौ MoCA नायफिन आरो मुलि लोंनायखौ नाय।`,
      dltTemplateId: '1407168923451239012',
    },
    medication: {
      title: '💊 मुलि लोंनो गोसोखां खौरां',
      badge: 'मुलि खौरां',
      familyMsg: `[स्मृतीसेतु मुलि] 💊 बोन्ती आइताया फुंनि मुलि लोंआसै। अननानै नाय।`,
      ashaMsg: `[आशा मुलि] 💊 न' नं 42 फुंनि मुलि लोंआसै। बेलासियाव थांनानै नाय।`,
      dltTemplateId: '1407163345127891234',
    },
  },
};

export const SmsDispatchModal: React.FC<SmsDispatchModalProps> = ({
  isOpen,
  onClose,
  currentLang = 'en',
  initialEvent = 'sos',
}) => {
  const [selectedEvent, setSelectedEvent] = useState<'sos' | 'anomaly' | 'medication'>(initialEvent);
  const [activeChannel, setActiveChannel] = useState<'family' | 'asha' | 'gateway'>('family');
  const [isSimulating, setIsSimulating] = useState(false);

  if (!isOpen) return null;

  const handleSimulateSend = () => {
    setIsSimulating(true);
    audio.playPluck(880);
    setTimeout(() => {
      audio.playSuccessChord();
      setIsSimulating(false);
    }, 600);
  };

  const currentLangEvents = localizedEvents[currentLang] || localizedEvents.en;
  const activeEventData = currentLangEvents[selectedEvent] || currentLangEvents.sos;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-lg animate-fade-in overflow-y-auto">
      <div className="glass-card w-full max-w-3xl max-h-[92vh] flex flex-col rounded-3xl p-5 sm:p-7 border border-[#ff5a00]/40 shadow-[0_0_80px_rgba(255,90,0,0.3)] relative my-auto overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors z-20 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10 pr-10 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-[#ff5a00]/20 text-[#ff7a29] border border-[#ff5a00]/40">
                <Smartphone className="w-5 h-5" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Dual-Channel Telephony & SMS Dispatch Gateway
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              National Health Mission (NER) • CDAC Mobile Seva & NIC SMS Transactional Telephony
            </p>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4 pt-3">
          {/* Event Selector Pill Switcher */}
          <div className="flex items-center gap-2 pb-1 overflow-x-auto">
            <button
              onClick={() => { setSelectedEvent('sos'); audio.playPluck(520); }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 border cursor-pointer ${
                selectedEvent === 'sos'
                  ? 'bg-red-600 text-white border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]'
                  : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Emergency SOS Event</span>
            </button>

            <button
              onClick={() => { setSelectedEvent('anomaly'); audio.playPluck(580); }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 border cursor-pointer ${
                selectedEvent === 'anomaly'
                  ? 'bg-amber-600 text-white border-amber-500 shadow-[0_0_15px_rgba(217,119,6,0.5)]'
                  : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Day 21 CHI Drop Alert (-23%)</span>
            </button>

            <button
              onClick={() => { setSelectedEvent('medication'); audio.playPluck(640); }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 border cursor-pointer ${
                selectedEvent === 'medication'
                  ? 'bg-sky-600 text-white border-sky-500 shadow-[0_0_15px_rgba(2,132,199,0.5)]'
                  : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Missed Medication Alert</span>
            </button>
          </div>

          {/* Selected Event Context Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-black/50 border border-white/5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full border bg-red-500/20 text-red-400 border-red-500/40">
                {activeEventData.badge}
              </span>
              <span className="text-xs sm:text-sm font-bold text-white">
                {activeEventData.title}
              </span>
            </div>
            <button
              onClick={handleSimulateSend}
              disabled={isSimulating}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#ff5a00] to-[#ff9d00] text-white text-xs font-bold flex items-center gap-1.5 shadow-glow-orange hover:scale-105 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-3 h-3" />
              <span>{isSimulating ? 'Sending SMS...' : 'Re-Send Telephony SMS'}</span>
            </button>
          </div>

          {/* Channel Switcher */}
          <div className="flex items-center gap-2 bg-black/60 p-1.5 rounded-2xl border border-white/10">
            <button
              onClick={() => setActiveChannel('family')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeChannel === 'family'
                  ? 'bg-[#ff5a00] text-white shadow-glow-orange'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>📱 Channel 1: Family Caregiver (+91 98765 43210)</span>
            </button>

            <button
              onClick={() => setActiveChannel('asha')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeChannel === 'asha'
                  ? 'bg-[#ff5a00] text-white shadow-glow-orange'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>🩺 Channel 2: ASHA Worker (+91 98765 43211)</span>
            </button>

            <button
              onClick={() => setActiveChannel('gateway')}
              className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeChannel === 'gateway'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Server className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Gateway Telemetry</span>
            </button>
          </div>

          {/* Simulated Handset Screen */}
          {(activeChannel === 'family' || activeChannel === 'asha') && (
            <div className="rounded-3xl border border-white/15 bg-gradient-to-b from-[#181a24] to-[#0f1118] p-4 sm:p-6 shadow-2xl relative">
              {/* Phone Status Bar */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 pb-3 border-b border-white/10 font-mono">
                <span className="font-bold text-white">09:42 AM</span>
                <div className="flex items-center gap-2">
                  <span>{activeChannel === 'family' ? 'Jio 5G (Kamrup Circle)' : 'BSNL 2G/Edge (Rural NER)'}</span>
                  <span className="text-emerald-400">● 100%</span>
                </div>
              </div>

              {/* Recipient Header */}
              <div className="py-2.5 text-center border-b border-white/5">
                <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#ff5a00] to-amber-500 mx-auto flex items-center justify-center text-white font-extrabold text-sm shadow-lg mb-1">
                  {activeChannel === 'family' ? 'FC' : 'AW'}
                </div>
                <strong className="text-white text-sm block">
                  {activeChannel === 'family' ? 'Family Primary Caregiver' : 'ASHA Health Worker (Anjali Das)'}
                </strong>
                <span className="text-[11px] text-slate-400 font-mono">
                  {activeChannel === 'family' ? '+91 98765 43210' : '+91 98765 43211'}
                </span>
              </div>

              {/* SMS Message Bubble */}
              <div className="py-3 space-y-2.5">
                <div className="text-center text-[10px] text-slate-400 font-mono">
                  Govt. Header: <strong className="text-slate-200">VK-SMRITI</strong> • Automated Telephony Dispatch
                </div>

                <div className="max-w-lg mx-auto bg-black/70 border border-white/15 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3">
                  <div className="flex items-center justify-between text-[11px] pb-2 border-b border-white/10">
                    <span className="font-bold text-[#ff7a29] flex items-center gap-1">
                      <Send className="w-3 h-3" />
                      <span>VK-SMRITI (CDAC MSDG)</span>
                    </span>
                    <span className="text-emerald-400 font-mono text-[10px] font-bold">● DLT Verified</span>
                  </div>

                  <p className="text-sm text-slate-100 font-sans leading-relaxed whitespace-pre-line">
                    {activeChannel === 'family' ? activeEventData.familyMsg : activeEventData.ashaMsg}
                  </p>

                  {/* Interactive Action Buttons */}
                  <div className="pt-2 flex flex-wrap items-center gap-2 border-t border-white/10">
                    <a
                      href="https://maps.google.com/?q=26.1433,91.7898"
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-300 text-xs font-bold flex items-center gap-1.5 transition-all"
                    >
                      <MapPin className="w-3.5 h-3.5 text-red-400" />
                      <span>View GPS Location (Kamrup, Assam)</span>
                      <ExternalLink className="w-3 h-3 ml-0.5" />
                    </a>

                    <a
                      href="tel:108"
                      className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-all"
                    >
                      <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Dial 108 Ambulance</span>
                    </a>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1">
                    <span>Govt. of Assam Health & Family Welfare</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Delivered (68ms)</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Gateway Telemetry Tab */}
          {activeChannel === 'gateway' && (
            <div className="rounded-3xl border border-white/15 bg-black/70 p-5 space-y-4 font-mono text-xs text-slate-300">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <span className="text-sm font-bold text-white">CDAC Mobile Seva / National SMS Gateway Telemetry</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                  2/2 CHANNELS ACTIVE
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                  <span className="text-slate-400 block">Gateway Endpoint</span>
                  <span className="text-white font-bold">https://msdgweb.mgov.gov.in/esms/push</span>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                  <span className="text-slate-400 block">Sender Header / Header ID</span>
                  <span className="text-white font-bold">VK-SMRITI (1101552390000034123)</span>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                  <span className="text-slate-400 block">TRAI DLT Template ID</span>
                  <span className="text-white font-bold">{activeEventData.dltTemplateId}</span>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                  <span className="text-slate-400 block">Payload Delivery Latency</span>
                  <span className="text-emerald-400 font-bold">68ms (SLA &lt;200ms)</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-black border border-white/10 text-emerald-400 text-[10px] leading-relaxed overflow-x-auto">
                <div>[2026-09-24T00:40:12Z] DISPATCH_START: Target recipients: [&quot;+919876543210&quot;, &quot;+919876543211&quot;]</div>
                <div>[2026-09-24T00:40:12Z] GATEWAY_CONNECT: Handshake SSL TLS 1.3 with CDAC MSDG host</div>
                <div>[2026-09-24T00:40:12Z] DLT_VALIDATE: Template match 100% compliant with transactional health category</div>
                <div>[2026-09-24T00:40:12Z] CHANNEL_1_DELIVERY: +919876543210 (Family Primary) -&gt; 200 OK (MsgID: 9918231)</div>
                <div>[2026-09-24T00:40:12Z] CHANNEL_2_DELIVERY: +919876543211 (ASHA Grassroots) -&gt; 200 OK (MsgID: 9918232)</div>
                <div className="text-white font-bold">[2026-09-24T00:40:12Z] DUAL_CHANNEL_SUCCESS: Both village channels notified.</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 flex items-center justify-between text-[11px] text-slate-400 border-t border-white/10 mt-3 shrink-0">
          <span>National Health Mission (Assam) • Secure Telehealth Messaging</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
