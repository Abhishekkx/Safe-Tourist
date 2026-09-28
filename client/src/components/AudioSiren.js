// Synthesizes a two-tone high-urgency emergency alarm siren using Web Audio API
class AudioSiren {
  constructor() {
    this.audioCtx = null;
    this.oscillator = null;
    this.gainNode = null;
    this.isPlaying = false;
  }

  play() {
    try {
      if (this.isPlaying) return;
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;

      this.audioCtx = new AudioContext();
      this.oscillator = this.audioCtx.createOscillator();
      this.gainNode = this.audioCtx.createGain();

      this.oscillator.type = 'sawtooth';
      this.oscillator.frequency.setValueAtTime(800, this.audioCtx.currentTime);
      
      // Siren tone modulation (alternates between 800Hz and 1200Hz)
      const now = this.audioCtx.currentTime;
      this.oscillator.frequency.linearRampToValueAtTime(1200, now + 0.4);
      this.oscillator.frequency.linearRampToValueAtTime(800, now + 0.8);
      this.oscillator.frequency.linearRampToValueAtTime(1200, now + 1.2);
      this.oscillator.frequency.linearRampToValueAtTime(800, now + 1.6);

      this.gainNode.gain.setValueAtTime(0.3, now);
      
      this.oscillator.connect(this.gainNode);
      this.gainNode.connect(this.audioCtx.destination);

      this.oscillator.start(now);
      this.oscillator.stop(now + 2.0);
      this.isPlaying = true;

      setTimeout(() => {
        this.isPlaying = false;
      }, 2000);
    } catch (e) {
      console.warn('Audio Siren playback error:', e);
    }
  }
}

export const siren = new AudioSiren();
