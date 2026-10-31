// Procedural Halloween Audio Synthesizer (Zero external files needed, 100% offline!)

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.ambientRunning = false;
    this.lastStepTime = 0;
  }

  ensureContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // 1. Spooky Nocturnal Wind Ambient Drone
  startAmbientWind() {
    this.ensureContext();
    if (!this.ctx || this.ambientRunning || this.isMuted) return;
    this.ambientRunning = true;

    try {
      // Noise buffer for wind gusts
      const bufferSize = this.ctx.sampleRate * 3;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        output[i] = (b0 + b1 + b2) * 0.12; // pinkish noise
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      // Bandpass filter for eerie wind howling
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(320, this.ctx.currentTime);
      filter.Q.setValueAtTime(3.0, this.ctx.currentTime);

      // Low frequency oscillator (LFO) modulating wind frequency
      const lfo = this.ctx.createOscillator();
      lfo.frequency.setValueAtTime(0.15, this.ctx.currentTime); // slow wave
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(140, this.ctx.currentTime);

      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);

      // Master ambient gain
      const gainNode = this.ctx.createGain();
      gainNode.gain.setValueAtTime(0.08, this.ctx.currentTime);

      whiteNoise.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(this.ctx.destination);

      whiteNoise.start();
      lfo.start();

      // Deep eerie bass sub-tone (40Hz drone)
      const subOsc = this.ctx.createOscillator();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(45, this.ctx.currentTime);
      const subGain = this.ctx.createGain();
      subGain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      subOsc.connect(subGain);
      subGain.connect(this.ctx.destination);
      subOsc.start();
    } catch (e) {
      console.warn('[Audio] Ambient start suppressed:', e.message);
    }
  }

  // 2. Footsteps on stone floor
  playFootstep() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = performance.now();
    if (now - this.lastStepTime < 380) return; // throttle cadence
    this.lastStepTime = now;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      // Low pitched stone contact thud
      const pitch = 75 + Math.random() * 20;
      osc.frequency.setValueAtTime(pitch, t);
      osc.frequency.exponentialRampToValueAtTime(30, t + 0.07);

      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.07);
    } catch (e) {}
  }

  // 3. Ethereal Spectral Chime (when talking to a Ghost)
  playGhostChime() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      // Frequencies for mystical chord (D minor mystical)
      const freqs = [440, 554.37, 659.25, 880];

      freqs.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t + i * 0.04);

        const duration = 1.2;
        gain.gain.setValueAtTime(0.08 / (i + 1), t + i * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t + i * 0.04);
        osc.stop(t + duration);
      });
    } catch (e) {}
  }

  // 4. Ghost typing blip
  playTypingBlip() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800 + Math.random() * 200, t);
      gain.gain.setValueAtTime(0.02, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.03);
    } catch (e) {}
  }
  // 5. Authentic wooden door creak and latch sound
  playDoorSound(isOpen) {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      if (isOpen) {
        // Door opening: creak (pitch slides 180Hz -> 260Hz)
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, t);
        osc.frequency.linearRampToValueAtTime(260, t + 0.35);

        gain.gain.setValueAtTime(0.04, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);
      } else {
        // Door closing: soft latch thud
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(120, t);
        osc.frequency.exponentialRampToValueAtTime(40, t + 0.15);

        gain.gain.setValueAtTime(0.06, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      }

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + (isOpen ? 0.4 : 0.2));
    } catch (e) {}
  }

  // 6. Artifact pickup chime
  playItemPickup() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t + i * 0.08);

        gain.gain.setValueAtTime(0.08, t + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.08 + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t + i * 0.08);
        osc.stop(t + i * 0.08 + 0.35);
      });
    } catch (e) {}
  }

  // 7. Grand Victory Fanfare & Bauman Chimes (Gaudeamus chord + bells)
  playVictoryFanfare() {
    if (this.isMuted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      // Majestic chord progression: C4, G4, C5, E5, G5
      const chord = [261.63, 392.00, 523.25, 659.25, 783.99];
      chord.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);

        gain.gain.setValueAtTime(0.06, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 2.5);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + 2.5);
      });

      // Shimmering chimes
      const bells = [1046.5, 1318.5, 1567.98, 2093.0];
      bells.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t + 0.5 + idx * 0.2);

        gain.gain.setValueAtTime(0.07, t + 0.5 + idx * 0.2);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.8 + idx * 0.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t + 0.5 + idx * 0.2);
        osc.stop(t + 1.8 + idx * 0.2);
      });
    } catch (e) {}
  }
}
export const soundEngine = new SoundEngine();
