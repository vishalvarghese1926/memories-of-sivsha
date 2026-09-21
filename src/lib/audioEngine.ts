"use client";

class AudioEngine {
  private ctx: AudioContext | null = null;
  private isInitialized = false;
  private isMuted = false;
  private masterGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private externalAudio: HTMLAudioElement | null = null;
  private chordInterval: NodeJS.Timeout | null = null;

  public init() {
    if (this.isInitialized && this.ctx) {
      if (this.ctx.state === "suspended") {
        this.ctx.resume();
      }
      return;
    }

    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.ambientGain = this.ctx.createGain();
      this.ambientGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      this.ambientGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.6, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.isInitialized = true;
      this.startGenerativeAmbient();
    } catch (e) {
      console.warn("Web Audio API could not be initialized:", e);
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 0.7, this.ctx.currentTime);
    }
    if (this.externalAudio) {
      this.externalAudio.muted = muted;
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  // Generative Romantic Ambient chords in F major / D minor
  private startGenerativeAmbient() {
    if (!this.ctx || !this.ambientGain || this.chordInterval) return;

    // Chord progressions: Fmaj7 -> Dm9 -> Bbmaj7 -> C9sus4
    const chordProgressions = [
      [174.61, 220.0, 261.63, 329.63], // Fmaj7 (F3, A3, C4, E4)
      [146.83, 220.0, 261.63, 329.63, 392.0], // Dm9 (D3, A3, C4, E4, G4)
      [116.54, 174.61, 233.08, 293.66, 349.23], // Bbmaj7 (Bb2, F3, Bb3, D4, F4)
      [130.81, 196.0, 261.63, 293.66, 392.0], // C9sus (C3, G3, C4, D4, G4)
    ];

    let currentChordIndex = 0;

    const playNextChord = () => {
      if (!this.ctx || !this.ambientGain || this.isMuted) return;
      if (this.ctx.state === "suspended") return;

      const chord = chordProgressions[currentChordIndex];
      currentChordIndex = (currentChordIndex + 1) % chordProgressions.length;

      chord.forEach((freq, idx) => {
        if (!this.ctx || !this.ambientGain) return;
        const osc = this.ctx.createOscillator();
        const noteGain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = idx % 2 === 0 ? "sine" : "triangle";
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        filter.type = "lowpass";
        filter.frequency.setValueAtTime(800 + Math.random() * 400, this.ctx.currentTime);

        const now = this.ctx.currentTime;
        const noteDuration = 7.5;
        const attack = 2.0;

        noteGain.gain.setValueAtTime(0.001, now);
        noteGain.gain.exponentialRampToValueAtTime(0.06 / chord.length, now + attack);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, now + noteDuration);

        osc.connect(filter);
        filter.connect(noteGain);
        noteGain.connect(this.ambientGain);

        osc.start(now);
        osc.stop(now + noteDuration);
      });
    };

    playNextChord();
    this.chordInterval = setInterval(playNextChord, 6000);
  }

  // Chime for envelope open, milestone unlock, or celebrations
  public playChime() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    const freqs = [523.25, 659.25, 783.99, 1046.5, 1318.51]; // C5, E5, G5, C6, E6

    freqs.forEach((freq, i) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + i * 0.08);

      gain.gain.setValueAtTime(0.001, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.18, now + i * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.08 + 1.2);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 1.3);
    });
  }

  // Wax seal breaking sound effect (crisp snap & fracture resonance)
  public playWaxSealCrack() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Filtered noise snap
    const bufferSize = this.ctx.sampleRate * 0.2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.03));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(1800, now);
    filter.Q.setValueAtTime(3, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(now);

    // Deep sub snap
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = "triangle";
    subOsc.frequency.setValueAtTime(120, now);
    subOsc.frequency.exponentialRampToValueAtTime(40, now + 0.15);

    subGain.gain.setValueAtTime(0.4, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    subOsc.connect(subGain);
    subGain.connect(this.sfxGain);

    subOsc.start(now);
    subOsc.stop(now + 0.2);
  }

  // Subtle UI click / pen tap
  public playClick() {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.06);
  }

  public playExternalAudio(url: string) {
    if (this.externalAudio) {
      this.externalAudio.pause();
      this.externalAudio = null;
    }
    this.externalAudio = new Audio(url);
    this.externalAudio.loop = true;
    this.externalAudio.muted = this.isMuted;
    this.externalAudio.play().catch((err) => {
      console.warn("External audio playback error:", err);
    });
  }

  public stopAll() {
    if (this.chordInterval) {
      clearInterval(this.chordInterval);
      this.chordInterval = null;
    }
    if (this.externalAudio) {
      this.externalAudio.pause();
      this.externalAudio = null;
    }
    if (this.ctx && this.ctx.state !== "closed") {
      this.ctx.suspend();
    }
  }
}

export const audioEngine = new AudioEngine();
