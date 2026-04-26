'use client';

let player: any;
let ctx: AudioContext;
let inst: any;
let started = false;

export async function initSF2() {
  // Check if we're on the client side
  if (typeof window === 'undefined') return;

  if (started) return;

  try {
    ctx = new AudioContext();
    await ctx.resume();

    console.log('Loading WebAudioFontPlayer...');
    await load(
      'https://surikov.github.io/webaudiofont/npm/dist/WebAudioFontPlayer.js'
    );
    
    console.log('Loading SBLive SoundFont...');
    await load(
      'https://surikov.github.io/webaudiofontdata/sound/0000_SBLive_sf2.js'
    );

    const WebAudioFontPlayer = (window as any).WebAudioFontPlayer;
    if (!WebAudioFontPlayer) {
      console.error('WebAudioFontPlayer not found');
      return;
    }
    
    player = new WebAudioFontPlayer();
    inst = (window as any)._tone_0000_SBLive_sf2;
    
    if (!inst) {
      console.error('SoundFont instrument not found');
      return;
    }

    started = true;
    console.log('✅ SF2 engine initialized successfully');
  } catch (error) {
    console.error('Failed to initialize SF2 engine:', error);
  }
}

export function playSF2(midi: number) {
  // Check if we're on the client side and initialized
  if (typeof window === 'undefined') {
    console.warn('playSF2 called on server side');
    return;
  }
  
  if (!player) {
    console.warn('SF2 player not initialized');
    return;
  }
  
  if (!ctx) {
    console.warn('AudioContext not initialized');
    return;
  }
  
  if (!inst) {
    console.warn('SoundFont instrument not loaded');
    return;
  }

  try {
    player.queueWaveTable(
      ctx,
      ctx.destination,
      inst,
      ctx.currentTime,
      midi,
      3,
      0.7
    );
  } catch (error) {
    console.error('Error playing SF2 note:', error);
  }
}

export function stopSF2(midi: number) {
  // Check if we're on the client side and initialized
  if (typeof window === 'undefined' || !player || !ctx || !inst) return;

  try {
    // WebAudioFontPlayer uses a different stop method
    player.stopAllSound(ctx);
  } catch (error) {
    console.error('Error stopping SF2 note:', error);
  }
}

export function testSF2Engine() {
  console.log('SF2 Engine Status:');
  console.log('- Started:', started);
  console.log('- Player:', !!player);
  console.log('- AudioContext:', !!ctx);
  console.log('- Instrument:', !!inst);
  console.log('- WebAudioFontPlayer:', !!(window as any).WebAudioFontPlayer);
  console.log('- SoundFont loaded:', !!(window as any)._tone_0000_SBLive_sf2);
}

function load(src: string) {
  return new Promise<void>((res) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = () => res();
    document.body.appendChild(s);
  });
}
