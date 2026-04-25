import { NOTES, noteIndex } from './notes';
import { THAATS } from './thaat';

export function generateScale(tonic: string, thaat: string) {
  const intervals = THAATS[thaat];

  // ✅ safety guard (prevents crash)
  if (!intervals) {
    console.error('Invalid thaat:', thaat);
    return [];
  }

  const tonicIdx = noteIndex(tonic);
  const scale: string[] = [];

  // 2 octaves
  for (let octave = 4; octave <= 5; octave++) {
    intervals.forEach((intv) => {
      let idx = tonicIdx + intv;
      let oct = octave;

      if (idx >= 12) {
        idx -= 12;
        oct += 1;
      }

      scale.push(`${NOTES[idx]}${oct}`);
    });
  }

  return scale;
}
