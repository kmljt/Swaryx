'use client';

let audioContext: AudioContext | null = null;
let masterGain: GainNode | null = null;
let activeNotes: Map<number, OscillatorNode[]> = new Map();

export async function initSimpleSoundEngine(): Promise<void> {
  if (audioContext) return;

  audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  masterGain = audioContext.createGain();
  masterGain.gain.value = 0.7;
  masterGain.connect(audioContext.destination);
}

export function playSimpleNote(midi: number, velocity: number = 0.8): void {
  if (!audioContext || !masterGain) return;

  const frequency = 440 * Math.pow(2, (midi - 69) / 12);
  
  // Create oscillator
  const oscillator = audioContext.createOscillator();
  oscillator.type = 'sine';
  oscillator.frequency.value = frequency;
  
  // Create gain for envelope
  const gainNode = audioContext.createGain();
  gainNode.gain.value = 0;
  
  // Connect nodes
  oscillator.connect(gainNode);
  gainNode.connect(masterGain);
  
  // Simple ADSR envelope
  const now = audioContext.currentTime;
  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(velocity * 0.3, now + 0.02); // Attack
  gainNode.gain.linearRampToValueAtTime(velocity * 0.2, now + 0.1); // Decay to sustain
  
  // Start oscillator
  oscillator.start(now);
  
  // Track active note
  if (!activeNotes.has(midi)) {
    activeNotes.set(midi, []);
  }
  activeNotes.get(midi)!.push(oscillator);
}

export function stopSimpleNote(midi: number): void {
  if (!audioContext) return;

  const oscillators = activeNotes.get(midi);
  if (!oscillators) return;

  const now = audioContext.currentTime;
  
  oscillators.forEach(oscillator => {
    try {
      // Apply release envelope
      oscillator.stop(now + 0.3);
    } catch (e) {
      // Oscillator might already be stopped
    }
  });
  
  activeNotes.delete(midi);
}
