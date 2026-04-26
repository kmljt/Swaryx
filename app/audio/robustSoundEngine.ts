'use client';

type Region = {
  sample: string;
  key: number;
  lovel: number;
  hivel: number;
};

type SFZMap = Map<number, Region[]>;

const ROOT_NOTES = [
  21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64,65,66,67,68,69,70,71,72,73,74,75,76,77,78,79,80,81,82,83,84,85,86,87,88,89,90,91,92,93,94,95,96,97,98,99,100,101,102,103,104,105,106,107,108
];

class SalamanderEngine {
  private ctx!: AudioContext;
  private master!: GainNode;
  private reverb!: ConvolverNode;
  private reverbGain!: GainNode;

  private sfzMap: SFZMap = new Map();
  private sampleCache: Map<string, AudioBuffer> = new Map();
  private activeSources: Map<number, AudioBufferSourceNode[]> = new Map();

  private sustain = false;
  private sustainedNotes = new Set<number>();

  private isInitialized = false;

  // ---------------- INIT ----------------
  async initialize() {
    if (this.isInitialized) return;

    this.ctx = new AudioContext();

    this.master = this.ctx.createGain();
    this.master.gain.value = 1.0;

    await this.loadReverb();
    this.buildMapping();

    this.master.connect(this.reverb);
    this.reverb.connect(this.reverbGain);
    this.reverbGain.connect(this.ctx.destination);

    this.isInitialized = true;
  }

  // ---------------- REVERB ----------------
  private async loadReverb() {
    this.reverb = this.ctx.createConvolver();
    this.reverbGain = this.ctx.createGain();
    this.reverbGain.gain.value = 0.2;

    try {
      const res = await fetch('/impulses/concert_hall.wav');
      const buf = await res.arrayBuffer();
      this.reverb.buffer = await this.ctx.decodeAudioData(buf);
    } catch {
      const length = this.ctx.sampleRate * 2;
      const impulse = this.ctx.createBuffer(2, length, this.ctx.sampleRate);

      for (let c = 0; c < 2; c++) {
        const data = impulse.getChannelData(c);
        for (let i = 0; i < length; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 1.2));
        }
      }

      this.reverb.buffer = impulse;
    }
  }

  // ---------------- BUILD MAPPING ----------------
  private buildMapping() {
    const velocityLayers = [
      { lovel: 1, hivel: 26, vel: 'v1' },
      { lovel: 27, hivel: 34, vel: 'v2' },
      { lovel: 35, hivel: 36, vel: 'v3' },
      { lovel: 37, hivel: 43, vel: 'v4' },
      { lovel: 44, hivel: 46, vel: 'v5' },
      { lovel: 47, hivel: 50, vel: 'v6' },
      { lovel: 51, hivel: 56, vel: 'v7' },
      { lovel: 57, hivel: 64, vel: 'v8' },
      { lovel: 65, hivel: 72, vel: 'v9' },
      { lovel: 73, hivel: 80, vel: 'v10' },
      { lovel: 81, hivel: 88, vel: 'v11' },
      { lovel: 89, hivel: 96, vel: 'v12' },
      { lovel: 97, hivel: 104, vel: 'v13' },
      { lovel: 105, hivel: 112, vel: 'v14' },
      { lovel: 113, hivel: 120, vel: 'v15' },
      { lovel: 121, hivel: 127, vel: 'v16' },
    ];

    const noteName = (midi: number) => {
      const n = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
      const octave = Math.floor(midi / 12) - 1;
      return `${n[midi % 12]}${octave}`;
    };

    const nearestRoot = (midi: number) => {
      return ROOT_NOTES.reduce((prev, curr) =>
        Math.abs(curr - midi) < Math.abs(prev - midi) ? curr : prev
      );
    };

    for (let midi = 21; midi <= 108; midi++) {
      const root = nearestRoot(midi);
      const rootName = noteName(root);

      for (const velLayer of velocityLayers) {
        const region: Region = {
          sample: `${rootName}${velLayer.vel}.wav`,
          key: midi,
          lovel: velLayer.lovel,
          hivel: velLayer.hivel
        };

        if (!this.sfzMap.has(midi)) this.sfzMap.set(midi, []);
        this.sfzMap.get(midi)!.push(region);
      }
    }

    console.log('✅ Salamander mapping ready');
  }

  // ---------------- SAMPLE LOADER ----------------
  private async getSample(sample: string): Promise<AudioBuffer> {
    if (this.sampleCache.has(sample)) {
      return this.sampleCache.get(sample)!;
    }

    let res = await fetch(`/SalamanderGrandPiano/Samples_wav/${sample}`);

    if (!res.ok) {
      console.warn('Missing sample:', sample);
      const fallback = sample.replace(/v\d+/, 'v8');
      res = await fetch(`/SalamanderGrandPiano/Samples_wav/${fallback}`);
    }

    const ab = await res.arrayBuffer();
    const buffer = await this.ctx.decodeAudioData(ab);

    this.sampleCache.set(sample, buffer);
    return buffer;
  }

  // ---------------- SELECT BEST VELOCITY ----------------
  private selectBestRegion(regions: Region[], velocity: number): Region | null {
    if (!regions.length) return null;

    let best = regions[0];
    let minDist = Infinity;

    for (const r of regions) {
      const center = (r.lovel + r.hivel) / 2;
      const dist = Math.abs(center - velocity);

      if (dist < minDist) {
        minDist = dist;
        best = r;
      }
    }

    return best;
  }

  // ---------------- PLAY ----------------
  async playNote(midi: number, velocity = 0.8) {
    if (!this.isInitialized) return;

    const vel127 = Math.max(1, Math.floor(velocity * 127));
    const regions = this.sfzMap.get(midi) || [];

    // Debug: log if no regions found
    if (regions.length === 0) {
      console.warn(`No regions found for MIDI ${midi} (${this.midiToNoteName(midi)})`);
      return;
    }

    const region = this.selectBestRegion(regions, vel127);
    if (!region) {
      console.warn(`No suitable region for MIDI ${midi}, velocity ${vel127}`);
      return;
    }

    const buffer = await this.getSample(region.sample);

    const src = this.ctx.createBufferSource();
    src.buffer = buffer;

    // 🎯 pitch correction
    const rootMidi = this.extractRootMidi(region.sample);
    const semitoneDiff = midi - rootMidi;
    src.playbackRate.value = Math.pow(2, semitoneDiff / 12);

    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    const pan = this.ctx.createStereoPanner();

    const vel = Math.pow(velocity, 2);

    filter.type = 'lowpass';
    filter.frequency.value = 2000 + vel * 8000;

    pan.pan.value = Math.max(-1, Math.min(1, (midi - 60) / 24));

    const now = this.ctx.currentTime;

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(vel, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(vel * 0.6, now + 0.4);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 8);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(pan);
    pan.connect(this.master);

    src.start();

    if (!this.activeSources.has(midi)) {
      this.activeSources.set(midi, []);
    }
    this.activeSources.get(midi)!.push(src);

    this.addHammerNoise(velocity);
  }

  private midiToNoteName(midi: number): string {
    const notes = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
    const octave = Math.floor(midi / 12) - 1;
    return `${notes[midi % 12]}${octave}`;
  }

  // ---------------- ROOT MIDI ----------------
  private extractRootMidi(sample: string): number {
    const match = sample.match(/^([A-G]#?\d)/);
    if (!match) return 60;

    const note = match[1];
    const notes = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];

    const pitch = note.slice(0, -1);
    const octave = parseInt(note.slice(-1));

    return (octave + 1) * 12 + notes.indexOf(pitch);
  }

  // ---------------- HAMMER ----------------
  private addHammerNoise(velocity: number) {
    const buf = this.ctx.createBuffer(1, 128, this.ctx.sampleRate);
    const data = buf.getChannelData(0);

    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.02;
    }

    const src = this.ctx.createBufferSource();
    const gain = this.ctx.createGain();

    gain.gain.value = velocity * 0.2;

    src.buffer = buf;
    src.connect(gain);
    gain.connect(this.master);

    const now = this.ctx.currentTime;
    src.start(now);
    src.stop(now + 0.02);
  }

  // ---------------- STOP ----------------
  stopNote(midi: number) {
    if (this.sustain) {
      this.sustainedNotes.add(midi);
      return;
    }

    const sources = this.activeSources.get(midi);
    if (!sources) return;

    const now = this.ctx.currentTime;

    sources.forEach(s => {
      try {
        s.stop(now + 0.2);
      } catch {}
    });

    this.activeSources.delete(midi);
  }

  // ---------------- PEDAL ----------------
  setSustain(on: boolean) {
    this.sustain = on;

    if (!on) {
      this.sustainedNotes.forEach(midi => this.stopNote(midi));
      this.sustainedNotes.clear();
    }
  }

  setVolume(v: number) {
    this.master.gain.value = Math.max(0, Math.min(1, v));
  }

  setReverb(v: number) {
    this.reverbGain.gain.value = Math.max(0, Math.min(1, v));
  }
}

// ---------------- EXPORT ----------------
let engine: SalamanderEngine | null = null;

export async function initPiano() {
  if (!engine) engine = new SalamanderEngine();
  await engine.initialize();
}

export function playNote(midi: number, velocity?: number) {
  engine?.playNote(midi, velocity);
}

export function stopNote(midi: number) {
  engine?.stopNote(midi);
}

export function sustain(on: boolean) {
  engine?.setSustain(on);
}