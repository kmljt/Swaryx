'use client';

interface SoundFontSample {
  midi: number;
  audioBuffer: AudioBuffer;
  basePitch: number;
  loopStart?: number;
  loopEnd?: number;
}

interface Voice {
  source: AudioBufferSourceNode;
  gainNode: GainNode;
  filter: BiquadFilterNode;
  startTime: number;
  stopTime?: number;
  midi: number;
}

class PremiumSoundEngine {
  private audioContext: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private reverb: ConvolverNode | null = null;
  private reverbGain: GainNode | null = null;
  private samples: Map<number, SoundFontSample[]> = new Map();
  private activeVoices: Map<number, Voice[]> = new Map();
  private isInitialized = false;
  private isLoading = false;

  // Premium SoundFont URLs (using publicly available high-quality samples)
  private readonly soundFontUrls = {
    // Salamander Grand Piano samples (high quality)
    salamander: 'https://github.com/gleitz/midi-js-soundfonts/raw/gh-pages/FluidR3_GM/acoustic_grand_piano-ogg.js',
    // Alternative high-quality options
    yamaha: 'https://github.com/gleitz/midi-js-soundfonts/raw/gh-pages/FluidR3_GM/acoustic_grand_piano-ogg.js',
    // We'll use FluidR3 which has excellent piano samples
    fluidR3: 'https://github.com/gleitz/midi-js-soundfonts/raw/gh-pages/FluidR3_GM/acoustic_grand_piano-ogg.js'
  };

  async initialize(): Promise<void> {
    if (this.isInitialized || this.isLoading) return;

    this.isLoading = true;

    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

      // Create master gain
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = 0.8;

      // Create professional compressor
      this.compressor = this.audioContext.createDynamicsCompressor();
      this.compressor.threshold.value = -18;
      this.compressor.knee.value = 20;
      this.compressor.ratio.value = 8;
      this.compressor.attack.value = 0.003;
      this.compressor.release.value = 0.1;

      // Create high-quality reverb
      await this.createReverb();

      // Connect audio chain
      this.masterGain!.connect(this.compressor!);
      this.compressor!.connect(this.reverb!);
      this.reverb!.connect(this.reverbGain!);
      this.reverbGain!.connect(this.audioContext.destination);

      // Load SoundFont samples
      await this.loadSoundFont();

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize premium sound engine:', error);
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  private async createReverb(): Promise<void> {
    if (!this.audioContext) return;

    this.reverb = this.audioContext.createConvolver();
    this.reverbGain = this.audioContext.createGain();
    this.reverbGain.gain.value = 0.12;

    // Create professional reverb impulse response
    const length = this.audioContext.sampleRate * 3; // 3 seconds
    const impulse = this.audioContext.createBuffer(2, length, this.audioContext.sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        // Multi-tap reverb with early reflections
        const decay = Math.exp(-i / (this.audioContext.sampleRate * 1.5));
        const earlyReflection = Math.sin(i * 0.01) * Math.exp(-i / (this.audioContext.sampleRate * 0.1));
        const random = (Math.random() * 2 - 1) * 0.02;
        channelData[i] = (earlyReflection + random) * decay * 0.5;
      }
    }

    this.reverb.buffer = impulse;
  }

  private async loadSoundFont(): Promise<void> {
    if (!this.audioContext) return;

    try {
      // Load FluidR3 SoundFont which has excellent piano samples
      await this.loadScript(this.soundFontUrls.fluidR3);
      
      // Extract samples from the loaded SoundFont
      const soundFontData = (window as any).FluidR3_GM_acoustic_grand_piano_ogg;
      if (soundFontData) {
        await this.processSoundFontData(soundFontData);
      }
    } catch (error) {
      console.error('Failed to load SoundFont:', error);
      // Fallback to basic synthesis if SoundFont fails
      throw new Error('SoundFont loading failed');
    }
  }

  private async processSoundFontData(soundFontData: any): Promise<void> {
    if (!this.audioContext) return;

    // Process each note sample
    for (let midi = 21; midi <= 108; midi++) { // Piano range
      const noteData = soundFontData[midi];
      if (noteData && noteData.length > 0) {
        const sample = noteData[0]; // Use first velocity layer
        
        // Create audio buffer from sample data
        const audioBuffer = this.audioContext.createBuffer(
          sample.channels || 1,
          sample.length,
          sample.sampleRate || this.audioContext.sampleRate
        );

        // Copy sample data to buffer
        if (sample.channels === 1) {
          audioBuffer.copyToChannel(new Float32Array(sample.data), 0);
        } else {
          audioBuffer.copyToChannel(new Float32Array(sample.data[0]), 0);
          audioBuffer.copyToChannel(new Float32Array(sample.data[1]), 1);
        }

        const soundFontSample: SoundFontSample = {
          midi,
          audioBuffer,
          basePitch: midi,
          loopStart: sample.loopStart,
          loopEnd: sample.loopEnd
        };

        if (!this.samples.has(midi)) {
          this.samples.set(midi, []);
        }
        this.samples.get(midi)!.push(soundFontSample);
      }
    }
  }

  private loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
      document.head.appendChild(script);
    });
  }

  private findBestSample(midi: number): SoundFontSample | null {
    // First try exact match
    if (this.samples.has(midi) && this.samples.get(midi)!.length > 0) {
      return this.samples.get(midi)![0];
    }

    // Find closest sample (for pitch shifting)
    let closestMidi = -1;
    let closestDistance = Infinity;

    for (const sampleMidi of Array.from(this.samples.keys())) {
      const distance = Math.abs(sampleMidi - midi);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestMidi = sampleMidi;
      }
    }

    if (closestMidi >= 0 && this.samples.get(closestMidi)!.length > 0) {
      return this.samples.get(closestMidi)![0];
    }

    return null;
  }

  playNote(midi: number, velocity: number = 0.8): void {
    if (!this.isInitialized || !this.audioContext) return;

    const sample = this.findBestSample(midi);
    if (!sample) {
      console.warn(`No sample found for MIDI note ${midi}`);
      return;
    }

    // Create audio source
    const source = this.audioContext.createBufferSource();
    source.buffer = sample.audioBuffer;

    // Apply pitch shifting if needed
    const pitchRatio = Math.pow(2, (midi - sample.basePitch) / 12);
    source.playbackRate.value = pitchRatio;

    // Set loop points if available
    if (sample.loopStart !== undefined && sample.loopEnd !== undefined) {
      source.loop = true;
      source.loopStart = sample.loopStart;
      source.loopEnd = sample.loopEnd;
    }

    // Create gain node for velocity control
    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = velocity * 0.5;

    // Create filter for tone shaping
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 8000;
    filter.Q.value = 1;

    // Connect audio nodes
    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.masterGain!);

    // Apply envelope
    const now = this.audioContext.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(velocity * 0.5, now + 0.01); // Fast attack

    // Start playback
    const startTime = now;
    source.start(startTime);

    // Track voice
    const voice: Voice = {
      source,
      gainNode,
      filter,
      startTime,
      midi
    };

    if (!this.activeVoices.has(midi)) {
      this.activeVoices.set(midi, []);
    }
    this.activeVoices.get(midi)!.push(voice);
  }

  stopNote(midi: number): void {
    if (!this.isInitialized || !this.audioContext) return;

    const voices = this.activeVoices.get(midi);
    if (!voices) return;

    const now = this.audioContext.currentTime;

    voices.forEach(voice => {
      // Apply release envelope
      const currentGain = voice.gainNode.gain.value;
      voice.gainNode.gain.cancelScheduledValues(now);
      voice.gainNode.gain.setValueAtTime(currentGain, now);
      voice.gainNode.gain.linearRampToValueAtTime(0, now + 0.5); // 0.5s release

      // Stop source after release
      voice.source.stop(now + 0.6);
    });

    this.activeVoices.delete(midi);
  }

  // Advanced controls
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

  dispose(): void {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.isInitialized = false;
    this.samples.clear();
    this.activeVoices.clear();
  }
}

// Singleton instance
let premiumEngine: PremiumSoundEngine | null = null;

export async function initPremiumSoundEngine(): Promise<void> {
  if (!premiumEngine) {
    premiumEngine = new PremiumSoundEngine();
  }
  await premiumEngine.initialize();
}

export function playPremiumNote(midi: number, velocity?: number): void {
  if (premiumEngine) {
    premiumEngine.playNote(midi, velocity);
  }
}

export function stopPremiumNote(midi: number): void {
  if (premiumEngine) {
    premiumEngine.stopNote(midi);
  }
}

export function setPremiumReverbLevel(level: number): void {
  if (premiumEngine) {
    premiumEngine.setReverbLevel(level);
  }
}

export function setPremiumMasterVolume(volume: number): void {
  if (premiumEngine) {
    premiumEngine.setMasterVolume(volume);
  }
}
