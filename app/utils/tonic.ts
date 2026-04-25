import { NOTES, noteIndex } from './notes';

export function applyTonic(note: string, tonic: string) {
  const name = note.slice(0, -1);
  const octave = parseInt(note.slice(-1));

  let val = noteIndex(name) + noteIndex(tonic);
  let oct = octave;

  if (val >= 12) {
    val -= 12;
    oct += 1;
  }

  return `${NOTES[val]}${oct}`;
}
