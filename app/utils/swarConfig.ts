export type SwarConfig = {
  re: 1 | 2;
  ga: 3 | 4;
  ma: 5 | 6;
  dha: 8 | 9;
  ni: 10 | 11;
};

export const DEFAULT_SWAR_CONFIG: SwarConfig = {
  re: 2,
  ga: 4,
  ma: 5,
  dha: 9,
  ni: 11,
};
