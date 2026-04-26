const CARNATIC_TO_WESTERN_NOTES = {
  S: '1',

  R1: '♭2',
  R2: '2',
  R3: '♯2',

  G1: '2',
  G2: '♭3',
  G3: '3',

  M1: '4',
  M2: '♯4',

  P: '5',

  D1: '♭6',
  D2: '6',
  D3: '♯6',

  N1: '6',
  N2: '♭7',
  N3: '7',
};


export const MELAKARTA_TO_WESTERN: Record<string, string> = {
  // ---------- M1 ----------

  // R1 G2
  hanumatodi: 'Phrygian',
  dhenuka: '1 ♭2 ♭3 4 5 ♭6 7',
  natakapriya: '1 ♭2 ♭3 4 5 6 ♭7',
  kokilapriya: '1 ♭2 ♭3 4 5 6 7',

  // R1 G3
  gayakapriya: '1 ♭2 3 4 5 ♭6 ♭7',
  vakulabharanam: 'Double Harmonic Major',
  chakravakam: 'Phrygian Dominant',
  suryakantam: '1 ♭2 3 4 5 6 7',

  // R2 G2
  natabhairavi: 'Aeolian',
  keeravani: 'Harmonic Minor',
  kharaharapriya: 'Dorian',
  gourimanohari: 'Melodic Minor',

  // R2 G3
  charukesi: 'Mixolydian ♭6',
  sarasangi: 'Ionian ♭6',
  harikambhoji: 'Mixolydian',
  dheerasankarabharanam: 'Ionian',

  // ---------- M2 ----------

  // R1 G2
  bhavapriya: '1 ♭2 ♭3 ♯4 5 ♭6 ♭7',
  subhapantuvarali: '1 ♭2 ♭3 ♯4 5 ♭6 7',
  shadvidamargini: '1 ♭2 ♭3 ♯4 5 6 ♭7',
  suvarnangi: '1 ♭2 ♭3 ♯4 5 6 7',

  // R1 G3
  dhavalambari: '1 ♭2 3 ♯4 5 ♭6 ♭7',
  namanarayani: '1 ♭2 3 ♯4 5 ♭6 7',
  ramapriya: '1 ♭2 3 ♯4 5 6 ♭7',
  gamanashrama: '1 ♭2 3 ♯4 5 6 7',

  // R2 G2
  shanmukhapriya: '1 2 ♭3 ♯4 5 ♭6 ♭7',
  simhendramadhyamam: 'Hungarian Minor',
  hemavati: 'Dorian ♯4',
  dharmavati: '1 2 ♭3 ♯4 5 6 7',

  // R2 G3
  latangi: '1 2 3 ♯4 5 ♭6 ♭7',
  vachaspati: 'Lydian Dominant',
  mechakalyani: 'Lydian',
  chitrambari: 'Lydian ♯6',
};

export default MELAKARTA_TO_WESTERN;