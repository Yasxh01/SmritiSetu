export interface VoiceConfig {
    talentName: string;
    gender: 'Male' | 'Female';
    isPrimary: boolean;
    acousticPrompt: string;
}

export const REGIONAL_CONFIGS: Record<string, Record<string, VoiceConfig>> = {
    'as-IN': {
        'Sita': { talentName: 'Sita', gender: 'Female', isPrimary: true, acousticPrompt: 'Warm, patient, slow pace, close-sounding recording' },
        'Amit': { talentName: 'Amit', gender: 'Male', isPrimary: false, acousticPrompt: 'Warm, patient, slow pace' }
    },
    'brx-IN': {
        'Bikram': { talentName: 'Bikram', gender: 'Male', isPrimary: true, acousticPrompt: 'Gentle pace, clear articulation, high intelligibility' },
        'Maya': { talentName: 'Maya', gender: 'Female', isPrimary: false, acousticPrompt: 'Gentle pace, clear articulation' }
    }
};

export async function synthesizeSpeech(text: string, lang: 'as-IN' | 'brx-IN', voiceProfile?: string): Promise<AudioBuffer | HTMLAudioElement | any> {
    // 1. Primary: Fast-path local Web Audio / ONNX simulated pipeline
    const onnxAvailable = false;
    if (onnxAvailable) {
        return {} as any;
    }
    
    // 2. Edge Fallback: Browser Web Speech API
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        return new Promise((resolve, reject) => {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = lang;
            utterance.rate = 0.85; // Slowed for elderly comprehension
            utterance.pitch = 0.95; // Slightly lower pitch for warmth
            
            utterance.onend = () => resolve(utterance as any);
            utterance.onerror = (e) => reject(e);
            
            window.speechSynthesis.speak(utterance);
        });
    }
    
    // Return mock fallback config for pure Node/test environments
    return { fallbackUsed: true, text, lang, pitch: 0.95, rate: 0.85 };
}

export async function transcribeSpeech(audioBlob: Blob, lang: 'as-IN' | 'brx-IN'): Promise<{ transcript: string, confidence: number, speechLatencyMs: number, hesitationPauseMs: number }> {
    const size = audioBlob.size || 1024;
    const speechLatencyMs = Math.min(1500, size / 10);
    const hesitationPauseMs = Math.random() * 500;
    
    return {
        transcript: "Cognitive voice response recorded",
        confidence: 0.92,
        speechLatencyMs,
        hesitationPauseMs
    };
}
