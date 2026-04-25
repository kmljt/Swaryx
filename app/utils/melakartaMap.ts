import { SwarConfig } from './swarConfig';

export const MELAKARTA_TO_CONFIG: Record<string, SwarConfig> = {
  // Melakarta 1–12
  kanakangi: { re: 1, ga: 2, ma: 5, dha: 8, ni: 9 },
  ratnangi: { re: 1, ga: 2, ma: 5, dha: 8, ni: 10 },
  ganamurti: { re: 1, ga: 2, ma: 5, dha: 8, ni: 11 },
  vanaspati: { re: 1, ga: 2, ma: 5, dha: 9, ni: 10 },
  manavati: { re: 1, ga: 2, ma: 5, dha: 9, ni: 11 },
  tanarupi: { re: 1, ga: 2, ma: 5, dha: 10, ni: 11 },
  
  senavati: { re: 1, ga: 3, ma: 5, dha: 8, ni: 11 },
  hanumatodi: { re: 1, ga: 3, ma: 5, dha: 8, ni: 10 },
  dhenuka: { re: 1, ga: 3, ma: 5, dha: 8, ni: 11 },
  natakapriya: { re: 1, ga: 3, ma: 5, dha: 9, ni: 10 },
  kokilapriya: { re: 1, ga: 3, ma: 5, dha: 9, ni: 11 },
  rupavati: { re: 1, ga: 3, ma: 5, dha: 10, ni: 11 },
  
  // Melakarta 13–24
  gayakapriya: { re: 1, ga: 4, ma: 5, dha: 8, ni: 9 },
  vakulabharanam: { re: 1, ga: 4, ma: 5, dha: 8, ni: 10 },
  mayamalavagowla: { re: 1, ga: 4, ma: 5, dha: 8, ni: 11 },
  chakravakam: { re: 1, ga: 4, ma: 5, dha: 9, ni: 10 },
  suryakantam: { re: 1, ga: 4, ma: 5, dha: 9, ni: 11 },
  hatakambari: { re: 1, ga: 4, ma: 5, dha: 10, ni: 11 },
  
  jhankaradhwani: { re: 2, ga: 3, ma: 5, dha: 8, ni: 9 },
  natabhairavi: { re: 2, ga: 3, ma: 5, dha: 8, ni: 10 },
  keeravani: { re: 2, ga: 3, ma: 5, dha: 8, ni: 11 },
  kharaharapriya: { re: 2, ga: 3, ma: 5, dha: 9, ni: 10 },
  gourimanohari: { re: 2, ga: 3, ma: 5, dha: 9, ni: 11 },
  varunapriya: { re: 2, ga: 3, ma: 5, dha: 10, ni: 11 },
  
  // Melakarta 25–36
  mararanjani: { re: 2, ga: 4, ma: 5, dha: 8, ni: 9 },
  charukesi: { re: 2, ga: 4, ma: 5, dha: 8, ni: 10 },
  sarasangi: { re: 2, ga: 4, ma: 5, dha: 8, ni: 11 },
  harikambhoji: { re: 2, ga: 4, ma: 5, dha: 9, ni: 10 },
  dheerasankarabharanam: { re: 2, ga: 4, ma: 5, dha: 9, ni: 11 },
  naganandini: { re: 2, ga: 4, ma: 5, dha: 10, ni: 11 },
  
  yagapriya: { re: 3, ga: 4, ma: 5, dha: 8, ni: 9 },
  ragavardhini: { re: 3, ga: 4, ma: 5, dha: 8, ni: 10 },
  gangeyabhushani: { re: 3, ga: 4, ma: 5, dha: 8, ni: 11 },
  vagadheeswari: { re: 3, ga: 4, ma: 5, dha: 9, ni: 10 },
  shulini: { re: 3, ga: 4, ma: 5, dha: 9, ni: 11 },
  chalanata: { re: 3, ga: 4, ma: 5, dha: 10, ni: 11 },
  
  // Melakarta 37–48 (M₂)
  salagam: { re: 1, ga: 2, ma: 6, dha: 8, ni: 9 },
  jalarnavam: { re: 1, ga: 2, ma: 6, dha: 8, ni: 10 },
  jhalavarali: { re: 1, ga: 2, ma: 6, dha: 8, ni: 11 },
  navaneetam: { re: 1, ga: 2, ma: 6, dha: 9, ni: 10 },
  pavani: { re: 1, ga: 2, ma: 6, dha: 9, ni: 11 },
  raghupriya: { re: 1, ga: 2, ma: 6, dha: 10, ni: 11 },
  
  gavambodhi: { re: 1, ga: 3, ma: 6, dha: 8, ni: 9 },
  bhavapriya: { re: 1, ga: 3, ma: 6, dha: 8, ni: 10 },
  subhapantuvarali: { re: 1, ga: 3, ma: 6, dha: 8, ni: 11 },
  shadvidhamargini: { re: 1, ga: 3, ma: 6, dha: 9, ni: 10 },
  suvarnangi: { re: 1, ga: 3, ma: 6, dha: 9, ni: 11 },
  divyamani: { re: 1, ga: 3, ma: 6, dha: 10, ni: 11 },
  
  // Melakarta 49–60
  dhavalambari: { re: 1, ga: 4, ma: 6, dha: 8, ni: 9 },
  namanarayani: { re: 1, ga: 4, ma: 6, dha: 8, ni: 10 },
  kamavardhini: { re: 1, ga: 4, ma: 6, dha: 8, ni: 11 },
  ramapriya: { re: 1, ga: 4, ma: 6, dha: 9, ni: 10 },
  gamanashrama: { re: 1, ga: 4, ma: 6, dha: 9, ni: 11 },
  vishwambari: { re: 1, ga: 4, ma: 6, dha: 10, ni: 11 },
  
  shamalangi: { re: 2, ga: 3, ma: 6, dha: 8, ni: 9 },
  shanmukhapriya: { re: 2, ga: 3, ma: 6, dha: 8, ni: 10 },
  simhendramadhyamam: { re: 2, ga: 3, ma: 6, dha: 8, ni: 11 },
  hemavati: { re: 2, ga: 3, ma: 6, dha: 9, ni: 10 },
  dharmavati: { re: 2, ga: 3, ma: 6, dha: 9, ni: 11 },
  neetimati: { re: 2, ga: 3, ma: 6, dha: 10, ni: 11 },
  
  // Melakarta 61–72
  kantamani: { re: 2, ga: 4, ma: 6, dha: 8, ni: 9 },
  rishabhapriya: { re: 2, ga: 4, ma: 6, dha: 8, ni: 10 },
  latangi: { re: 2, ga: 4, ma: 6, dha: 8, ni: 11 },
  vachaspati: { re: 2, ga: 4, ma: 6, dha: 9, ni: 10 },
  mechakalyani: { re: 2, ga: 4, ma: 6, dha: 9, ni: 11 },
  chitrambari: { re: 2, ga: 4, ma: 6, dha: 10, ni: 11 },
  
  sucharitra: { re: 3, ga: 4, ma: 6, dha: 8, ni: 9 },
  jyotisvarupini: { re: 3, ga: 4, ma: 6, dha: 8, ni: 10 },
  dhatuvardhani: { re: 3, ga: 4, ma: 6, dha: 8, ni: 11 },
  nasikabhushani: { re: 3, ga: 4, ma: 6, dha: 9, ni: 10 },
  kosalam: { re: 3, ga: 4, ma: 6, dha: 9, ni: 11 },
  rasikapriya: { re: 3, ga: 4, ma: 6, dha: 10, ni: 11 },
};

export const MELAKARTA_NAMES = Object.keys(MELAKARTA_TO_CONFIG);

export function detectMelakarta(c: SwarConfig): string {
  for (const [name, cfg] of Object.entries(MELAKARTA_TO_CONFIG)) {
    if (
      c.re === cfg.re &&
      c.ga === cfg.ga &&
      c.ma === cfg.ma &&
      c.dha === cfg.dha &&
      c.ni === cfg.ni
    )
      return name;
  }
  return 'custom';
}