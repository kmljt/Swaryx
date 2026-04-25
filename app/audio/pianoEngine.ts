"use client";

import * as Tone from "tone";

let piano: Tone.Sampler;
let started = false;

let reverb: Tone.Reverb;
let eq: Tone.EQ3;
let gain: Tone.Gain;
let compressor: Tone.Compressor;
let widener: Tone.StereoWidener;

let sustain = false;
const sustainedNotes = new Set<string>();

export async function initAudio() {
  if (started) return;

  await Tone.start();

  gain = new Tone.Gain(0.9);

  eq = new Tone.EQ3({ low: -3, mid: -1, high: 4 });

  reverb = new Tone.Reverb({ decay: 3.2, wet: 0.25 });

  compressor = new Tone.Compressor({
    threshold: -18,
    ratio: 3,
    attack: 0.01,
    release: 0.3
  });

  widener = new Tone.StereoWidener(0.6);

  piano = new Tone.Sampler({
    urls: {
      A0: "A0.mp3",
      C1: "C1.mp3",
      "D#1": "Ds1.mp3",
      "F#1": "Fs1.mp3",
      A1: "A1.mp3",
      C2: "C2.mp3",
      "D#2": "Ds2.mp3",
      "F#2": "Fs2.mp3",
      A2: "A2.mp3",
      C3: "C3.mp3",
      "D#3": "Ds3.mp3",
      "F#3": "Fs3.mp3",
      A3: "A3.mp3",
      C4: "C4.mp3",
      "D#4": "Ds4.mp3",
      "F#4": "Fs4.mp3",
      A4: "A4.mp3",
      C5: "C5.mp3"
    },
    baseUrl: "https://tonejs.github.io/audio/salamander/",
    release: 5
  });

  piano.chain(eq, compressor, widener, gain, reverb, Tone.Destination);

  await Tone.loaded();
  started = true;
}

function velocity() {
  const v = Math.random();
  return 0.6 + v * v * 0.4;
}

export function attack(note: string) {
  piano.triggerAttack(note, undefined, velocity());
}

export function release(note: string) {
  if (sustain) sustainedNotes.add(note);
  else piano.triggerRelease(note);
}

export function setSustain(v: boolean) {
  sustain = v;
  reverb.wet.value = v ? 0.35 : 0.25;

  if (!v) {
    sustainedNotes.forEach(n => piano.triggerRelease(n));
    sustainedNotes.clear();
  }
}