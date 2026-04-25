import { SwarConfig } from './swarConfig';

export const THAAT_TO_CONFIG: Record<string, SwarConfig> = {
  bilawal: { re: 2, ga: 4, ma: 5, dha: 9, ni: 11 },
  asavari: { re: 2, ga: 3, ma: 5, dha: 8, ni: 10 },
  kafi: { re: 2, ga: 3, ma: 5, dha: 9, ni: 10 },
  bhairav: { re: 1, ga: 4, ma: 5, dha: 8, ni: 11 },
  bhairavi: { re: 1, ga: 3, ma: 5, dha: 8, ni: 10 },
  kalyan: { re: 2, ga: 4, ma: 6, dha: 9, ni: 11 },
  todi: { re: 1, ga: 3, ma: 6, dha: 8, ni: 11 },
  marwa: { re: 1, ga: 4, ma: 6, dha: 9, ni: 11 },
  poorvi: { re: 1, ga: 4, ma: 6, dha: 8, ni: 11 },
  khamaj: { re: 2, ga: 4, ma: 5, dha: 9, ni: 10 },
};

export function detectThaat(c: SwarConfig): string {
  for (const [name, cfg] of Object.entries(THAAT_TO_CONFIG)) {
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
