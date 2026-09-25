// Web Audio API acoustic feedback & regional sound synthesizer
class AudioService {
  private ctx: AudioContext | null = null;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Play a pleasant wooden chime (Assamese Tokari-like pluck)
  playPluck(freq = 440) {
    try {
      this.initContext();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.98, this.ctx.currentTime + 0.3);

      gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.36);
    } catch (e) {
      // Audio might be blocked before first interaction
    }
  }

  // Celebratory bell chord (when patient matches a card)
  playSuccessChord() {
    try {
      this.initContext();
      if (!this.ctx) return;
      const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      freqs.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx!.currentTime + idx * 0.08);

        gain.gain.setValueAtTime(0.2, this.ctx!.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + idx * 0.08 + 0.5);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(this.ctx!.currentTime + idx * 0.08);
        osc.stop(this.ctx!.currentTime + idx * 0.08 + 0.55);
      });
    } catch (e) {}
  }

  playChime(...args: any[]) {
    this.playSuccessChord();
  }

  // Calming soothing ambient wave (Anxiety-Relief Guard trigger)
  playCalmingTone() {
    try {
      this.initContext();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(329.63, this.ctx.currentTime); // E4
      osc.frequency.exponentialRampToValueAtTime(261.63, this.ctx.currentTime + 1.2); // C4

      gain.gain.setValueAtTime(0.01, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.25, this.ctx.currentTime + 0.5);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 2.0);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 2.1);
    } catch (e) {}
  }

  // Bihu Dhol drum beat simulation (Deep acoustic rhythm)
  playDholBeat(low = true) {
    try {
      this.initContext();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      const startFreq = low ? 120 : 280;
      const endFreq = low ? 45 : 110;

      osc.frequency.setValueAtTime(startFreq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(endFreq, this.ctx.currentTime + 0.18);

      gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.23);
    } catch (e) {}
  }

  // Synthesize Bihu Dhol (3 second rhythmic drum pattern)
  playDholSound() {
    try {
      this.initContext();
      if (!this.ctx) return;
      
      const now = this.ctx.currentTime;
      const hits = [
        { delay: 0, low: true },
        { delay: 0.6, low: false },
        { delay: 1.2, low: true },
        { delay: 1.8, low: false },
        { delay: 2.4, low: true }
      ];

      hits.forEach(({ delay, low }) => {
        const t = now + delay;
        
        // Drum Body (Thump)
        const osc1 = this.ctx!.createOscillator();
        const gain1 = this.ctx!.createGain();
        osc1.type = 'triangle';
        const startFreq = low ? 200 : 350;
        const endFreq = low ? 80 : 120;
        osc1.frequency.setValueAtTime(startFreq, t);
        osc1.frequency.exponentialRampToValueAtTime(endFreq, t + 0.15);
        gain1.gain.setValueAtTime(1.0, t);
        gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        osc1.connect(gain1);
        gain1.connect(this.ctx!.destination);
        osc1.start(t);
        osc1.stop(t + 0.35);

        // Drum Skin Slap (High frequency crack)
        const osc2 = this.ctx!.createOscillator();
        const gain2 = this.ctx!.createGain();
        osc2.type = 'square';
        osc2.frequency.setValueAtTime(low ? 400 : 600, t);
        osc2.frequency.exponentialRampToValueAtTime(low ? 200 : 300, t + 0.05);
        gain2.gain.setValueAtTime(0.15, t);
        gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
        osc2.connect(gain2);
        gain2.connect(this.ctx!.destination);
        osc2.start(t);
        osc2.stop(t + 0.15);
      });
    } catch (e) {
      console.error("Audio error in playDholSound:", e);
    }
  }

  // Synthesize Tokari String (3 second melodic folk arpeggio)
  playTokariSound() {
    try {
      this.initContext();
      if (!this.ctx) return;
      const baseFreq = 380;
      const now = this.ctx.currentTime;
      [0, 0.6, 1.2, 1.8, 2.4].forEach((delay, idx) => {
        const t = now + delay;
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        const multipliers = [1, 1.189, 1.335, 1.5, 1.189]; 
        const freq = baseFreq * multipliers[idx];
        osc.frequency.setValueAtTime(freq, t);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.98, t + 0.5);
        gain.gain.setValueAtTime(0.35, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(t);
        osc.stop(t + 0.7);
      });
    } catch (e) {
      console.error("Audio error in playTokariSound:", e);
    }
  }

  // Synthesize realistic rain sound using white noise and a lowpass filter
  playRainSound() {
    try {
      this.initContext();
      if (!this.ctx) return;
      const bufferSize = this.ctx.sampleRate * 3.5; 
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      
      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = buffer;
      
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 600; // Muffled, soothing rain
      
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.01, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.4, this.ctx.currentTime + 0.3);
      gain.gain.linearRampToValueAtTime(0.4, this.ctx.currentTime + 2.5);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 3.0);
      
      noiseSource.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      
      noiseSource.start();
    } catch (e) {}
  }

  // Synthesize a bamboo flute using sine wave and vibrato (LFO)
  playFluteSound(freq = 659.25) { // E5 note
    try {
      this.initContext();
      if (!this.ctx) return;
      
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      
      const lfo = this.ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 5.5; // Vibrato rate
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.value = 10; // Vibrato depth
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      
      gain.gain.setValueAtTime(0.01, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.4, this.ctx.currentTime + 0.3); // soft attack
      gain.gain.linearRampToValueAtTime(0.3, this.ctx.currentTime + 2.5); // sustain
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 3.0); // soft release
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start();
      lfo.start();
      
      osc.stop(this.ctx.currentTime + 3.1);
      lfo.stop(this.ctx.currentTime + 3.1);
    } catch (e) {}
  }

  // Text to Speech for regional or elderly prompts
  speak(text: string, lang = 'as') {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.85; // Slightly slower pace for elderly comprehension
      utterance.pitch = 1.0;
      
      // Attempt to find regional voice if available
      const voices = window.speechSynthesis.getVoices();
      const match = voices.find(v => v.lang.startsWith(lang) || v.lang.startsWith('hi'));
      if (match) {
        utterance.voice = match;
      }
      window.speechSynthesis.speak(utterance);
    }
  }
}

export const audio = new AudioService();
