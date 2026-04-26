'use client';

interface Note {
  midi: number;
  frequency: number;
  startTime: number;
  duration: number;
  velocity: number;
  activeNodes: AudioNode[];
}

interface Voice {
  oscillator: OscillatorNode;
  gainNode: GainNode;
  filterNode: BiquadFilterNode;
  envelope: ADSREnvelope;
  stopTime?: number;
}

interface ADSREnvelope {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  attackCurve: number;
  decayCurve: number;
  releaseCurve: number;
}

class AdvancedSoundEngine {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private reverb: ConvolverNode | null = null;
  private reverbGain: GainNode | null = null;
  private activeNotes: Map<number, Voice[]> = new Map();
  private isInitialized = false;
  private sampleRate = 44100;

  // High-quality synthesis parameters
  private readonly harmonics = [1, 0.5, 0.25, 0.125, 0.0625, 0.03125];
  private readonly detuneAmount = 2; // cents
  private readonly stereoSpread = 0.02; // seconds

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.sampleRate = this.audioContext.sampleRate;

    // Create master gain and compression
    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = 0.7;

    this.compressor = this.audioContext.createDynamicsCompressor();
    this.compressor.threshold.value = -24;
    this.compressor.knee.value = 30;
    this.compressor.ratio.value = 12;
    this.compressor.attack.value = 0.003;
    this.compressor.release.value = 0.25;

    // Create reverb
    await this.createReverb();

    // Connect audio graph
    this.compressor!.connect(this.reverb!);
    this.reverb!.connect(this.reverbGain!);
    this.reverbGain!.connect(this.masterGain!);
    this.masterGain!.connect(this.audioContext.destination);

    this.isInitialized = true;
  }

  private async createReverb(): Promise<void> {
    if (!this.audioContext) return;

    this.reverb = this.audioContext.createConvolver();
    this.reverbGain = this.audioContext.createGain();
    this.reverbGain.gain.value = 0.15;

    // Create high-quality reverb impulse response
    const length = this.audioContext.sampleRate * 2; // 2 seconds of reverb
    const impulse = this.audioContext.createBuffer(2, length, this.audioContext.sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        // Exponential decay with some randomness for natural sound
        const decay = Math.exp(-i / (this.audioContext.sampleRate * 0.5));
        const random = (Math.random() * 2 - 1) * 0.01;
        channelData[i] = (Math.random() * 2 - 1) * decay * (1 + random);
      }
    }

    this.reverb.buffer = impulse;
  }

  private createVoice(midi: number, velocity: number): Voice {
    if (!this.audioContext) throw new Error('AudioContext not initialized');

    const frequency = 440 * Math.pow(2, (midi - 69) / 12);

    // Create oscillator with advanced waveform
    const oscillator = this.audioContext.createOscillator();
    oscillator.type = 'sawtooth';
    oscillator.frequency.value = frequency;

    // Create filter for natural sound shaping
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 2000 + (frequency / 4); // Dynamic cutoff
    filter.Q.value = 2 + (velocity * 3); // Dynamic resonance

    // Create gain node for envelope
    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = 0;

    // ADSR envelope parameters
    const envelope: ADSREnvelope = {
      attack: 0.02 + (velocity * 0.03),
      decay: 0.1 + (velocity * 0.05),
      sustain: 0.3 + (velocity * 0.2),
      release: 0.3 + (velocity * 0.4),
      attackCurve: 3,
      decayCurve: 3,
      releaseCurve: 3
    };

    return { oscillator, gainNode, filterNode: filter, envelope };
  }

  private applyEnvelope(voice: Voice, startTime: number, duration: number): void {
    const { gainNode, envelope } = voice;
    const now = startTime;

    // Attack
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(1, now + envelope.attack);

    // Decay to sustain
    gainNode.gain.linearRampToValueAtTime(envelope.sustain, now + envelope.attack + envelope.decay);

    // Hold sustain until release
    if (duration > 0) {
      const releaseTime = now + duration;
      gainNode.gain.setValueAtTime(envelope.sustain, releaseTime);
      gainNode.gain.linearRampToValueAtTime(0, releaseTime + envelope.release);
    }
  }

  private addHarmonics(voice: Voice, baseFrequency: number): void {
    if (!this.audioContext) return;

    // Add subtle harmonics for richer sound
    this.harmonics.forEach((harmonic, index) => {
      if (index === 0) return; // Skip fundamental frequency

      const harmonicOsc = this.audioContext!.createOscillator();
      const harmonicGain = this.audioContext!.createGain();
      
      harmonicOsc.frequency.value = baseFrequency * (index + 1);
      harmonicOsc.type = index % 2 === 0 ? 'sine' : 'triangle';
      harmonicGain.gain.value = harmonic * 0.3;

      harmonicOsc.connect(harmonicGain);
      harmonicGain.connect(voice.filterNode);
      
      harmonicOsc.start();
      const stopTime = voice.stopTime || (this.audioContext!.currentTime + 10);
      harmonicOsc.stop(stopTime);
    });
  }

  playNote(midi: number, velocity: number = 0.8, duration: number = -1): void {
    if (!this.isInitialized || !this.audioContext) return;

    // Create main voice
    const voice = this.createVoice(midi, velocity);
    const frequency = 440 * Math.pow(2, (midi - 69) / 12);

    // Add stereo spread for natural sound
    const panNode = this.audioContext.createStereoPanner();
    panNode.pan.value = (Math.random() - 0.5) * 0.2;

    // Connect audio nodes
    voice.oscillator.connect(voice.filterNode);
    voice.filterNode.connect(voice.gainNode);
    voice.gainNode.connect(panNode);
    panNode.connect(this.compressor!);

    // Apply envelope
    const startTime = this.audioContext.currentTime;
    this.applyEnvelope(voice, startTime, duration);

    // Add harmonics
    this.addHarmonics(voice, frequency);

    // Start oscillator
    voice.oscillator.start(startTime);

    // Schedule stop if duration is specified
    if (duration > 0) {
      voice.oscillator.stop(startTime + duration + voice.envelope.release);
    } else {
      voice.stopTime = startTime + 10; // Default long duration
    }

    // Track active note
    if (!this.activeNotes.has(midi)) {
      this.activeNotes.set(midi, []);
    }
    this.activeNotes.get(midi)!.push(voice);
  }

  stopNote(midi: number): void {
    if (!this.isInitialized || !this.audioContext) return;

    const voices = this.activeNotes.get(midi);
    if (!voices) return;

    const now = this.audioContext.currentTime;
    
    voices.forEach(voice => {
      // Apply release envelope
      const currentGain = voice.gainNode.gain.value;
      voice.gainNode.gain.cancelScheduledValues(now);
      voice.gainNode.gain.setValueAtTime(currentGain, now);
      voice.gainNode.gain.linearRampToValueAtTime(0, now + voice.envelope.release);
      
      // Stop oscillator after release
      voice.oscillator.stop(now + voice.envelope.release);
    });

    this.activeNotes.delete(midi);
  }

  // Advanced features for better sound quality
  setReverbLevel(level: number): void {
    if (this.reverbGain) {
      this.reverbGain.gain.value = Math.max(0, Math.min(1, level));
    }
  }

  setMasterVolume(volume: number): void {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  // Cleanup
  dispose(): void {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.isInitialized = false;
    this.activeNotes.clear();
  }
}

// Singleton instance
let soundEngine: AdvancedSoundEngine | null = null;

export async function initAdvancedSoundEngine(): Promise<void> {
  if (!soundEngine) {
    soundEngine = new AdvancedSoundEngine();
  }
  await soundEngine.initialize();
}

export function playAdvancedNote(midi: number, velocity?: number, duration?: number): void {
  if (soundEngine) {
    soundEngine.playNote(midi, velocity, duration);
  }
}

export function stopAdvancedNote(midi: number): void {
  if (soundEngine) {
    soundEngine.stopNote(midi);
  }
}

export function setReverbLevel(level: number): void {
  if (soundEngine) {
    soundEngine.setReverbLevel(level);
  }
}

export function setMasterVolume(volume: number): void {
  if (soundEngine) {
    soundEngine.setMasterVolume(volume);
  }
}
