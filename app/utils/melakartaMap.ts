import { SwarConfig } from './swarConfig';

export const MELAKARTA_TO_CONFIG: Record<string, SwarConfig> = {
  // ---------- M1 (ma:5) ----------

  // R1 G2
  hanumatodi: { re: 1, ga: 3, ma: 5, dha: 8, ni: 10 },
  dhenuka: { re: 1, ga: 3, ma: 5, dha: 8, ni: 11 },
  natakapriya: { re: 1, ga: 3, ma: 5, dha: 9, ni: 10 },
  kokilapriya: { re: 1, ga: 3, ma: 5, dha: 9, ni: 11 },

  // R1 G3
  gayakapriya: { re: 1, ga: 4, ma: 5, dha: 8, ni: 10 },
  vakulabharanam: { re: 1, ga: 4, ma: 5, dha: 8, ni: 11 },
  chakravakam: { re: 1, ga: 4, ma: 5, dha: 9, ni: 10 },
  suryakantam: { re: 1, ga: 4, ma: 5, dha: 9, ni: 11 },

  // R2 G2
  natabhairavi: { re: 2, ga: 3, ma: 5, dha: 8, ni: 10 },
  keeravani: { re: 2, ga: 3, ma: 5, dha: 8, ni: 11 },
  kharaharapriya: { re: 2, ga: 3, ma: 5, dha: 9, ni: 10 },
  gourimanohari: { re: 2, ga: 3, ma: 5, dha: 9, ni: 11 },

  // R2 G3
  charukesi: { re: 2, ga: 4, ma: 5, dha: 8, ni: 10 },
  sarasangi: { re: 2, ga: 4, ma: 5, dha: 8, ni: 11 },
  harikambhoji: { re: 2, ga: 4, ma: 5, dha: 9, ni: 10 },
  dheerasankarabharanam: { re: 2, ga: 4, ma: 5, dha: 9, ni: 11 },

  // ---------- M2 (ma:6) ----------

  // R1 G2
  bhavapriya: { re: 1, ga: 3, ma: 6, dha: 8, ni: 10 },
  subhapantuvarali: { re: 1, ga: 3, ma: 6, dha: 8, ni: 11 },
  shadvidamargini: { re: 1, ga: 3, ma: 6, dha: 9, ni: 10 },
  suvarnangi: { re: 1, ga: 3, ma: 6, dha: 9, ni: 11 },

  // R1 G3
  dhavalambari: { re: 1, ga: 4, ma: 6, dha: 8, ni: 10 },
  namanarayani: { re: 1, ga: 4, ma: 6, dha: 8, ni: 11 },
  ramapriya: { re: 1, ga: 4, ma: 6, dha: 9, ni: 10 },
  gamanashrama: { re: 1, ga: 4, ma: 6, dha: 9, ni: 11 },

  // R2 G2
  shanmukhapriya: { re: 2, ga: 3, ma: 6, dha: 8, ni: 10 },
  simhendramadhyamam: { re: 2, ga: 3, ma: 6, dha: 8, ni: 11 },
  hemavati: { re: 2, ga: 3, ma: 6, dha: 9, ni: 10 },
  dharmavati: { re: 2, ga: 3, ma: 6, dha: 9, ni: 11 },

  // R2 G3
  latangi: { re: 2, ga: 4, ma: 6, dha: 8, ni: 10 },
  vachaspati: { re: 2, ga: 4, ma: 6, dha: 8, ni: 11 },
  mechakalyani: { re: 2, ga: 4, ma: 6, dha: 9, ni: 10 },
  chitrambari: { re: 2, ga: 4, ma: 6, dha: 9, ni: 11 },
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