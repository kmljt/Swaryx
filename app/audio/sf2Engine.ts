'use client';

let player: any;
let ctx: AudioContext;
let inst: any;
let started = false;

export async function initSF2() {
  // Check if we're on the client side
  if (typeof window === 'undefined') return;

  if (started) return;

  ctx = new AudioContext();

  await load(
    'https://surikov.github.io/webaudiofont/npm/dist/WebAudioFontPlayer.js'
  );
  await load(
    'https://surikov.github.io/webaudiofontdata/sound/0000_SBLive_sf2.js'
  );

  const WebAudioFontPlayer = (window as any).WebAudioFontPlayer;
  player = new WebAudioFontPlayer();
  inst = (window as any)._tone_0000_SBLive_sf2;

  started = true;
}

export function playSF2(midi: number) {
  // Check if we're on the client side and initialized
  if (typeof window === 'undefined' || !player || !ctx || !inst) return;

  player.queueWaveTable(
    ctx,
    ctx.destination,
    inst,
    ctx.currentTime,
    midi,
    3,
    0.7
  );
}

function load(src: string) {
  return new Promise<void>((res) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = () => res();
    document.body.appendChild(s);
  });
}
