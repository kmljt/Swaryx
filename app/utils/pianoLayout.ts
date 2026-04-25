export const keys = [
  "C","C#","D","D#","E","F","F#","G","G#","A","A#","B",
  "C","C#","D","D#","E","F","F#","G","G#","A","A#","B"
].map((n, i) => ({
  note: `${n}${i < 12 ? 4 : 5}`,
  type: n.includes("#") ? "black" : "white"
}));