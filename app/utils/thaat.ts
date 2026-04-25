import { NOTES, noteIndex } from './notes';

const SWARS = [
  'Sa',
  'Re♭',
  'Re',
  'Ga♭',
  'Ga',
  'Ma',
  'Ma+',
  'Pa',
  'Dha♭',
  'Dha',
  'Ni♭',
  'Ni',
];

export const THAATS: Record<string, number[]> = {
  bilawal: [0, 2, 4, 5, 7, 9, 11],
  kalyan: [0, 2, 4, 6, 7, 9, 11],
  khamaj: [0, 2, 4, 5, 7, 9, 10],
  kafi: [0, 2, 3, 5, 7, 9, 10],
  asavari: [0, 2, 3, 5, 7, 8, 10],
  bhairav: [0, 1, 4, 5, 7, 8, 11],
  bhairavi: [0, 1, 3, 5, 7, 8, 10],
  todi: [0, 1, 3, 6, 7, 8, 11],
  marwa: [0, 1, 4, 6, 7, 9, 11],
  poorvi: [0, 1, 4, 6, 7, 8, 11],
};

export function getSwar(note: string, tonic: string, thaat: string) {
  const name = note.slice(0, -1);

  let diff = noteIndex(name) - noteIndex(tonic);
  if (diff < 0) diff += 12;

  if (!THAATS[thaat].includes(diff)) return '';

  return SWARS[diff];
}
