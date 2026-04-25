'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
} from 'react';
import { NOTES, noteIndex } from '@/app/utils/notes';
import { initSF2, playSF2 } from '@/app/audio/sf2Engine';
import { DEFAULT_SWAR_CONFIG, SwarConfig } from '@/app/utils/swarConfig';
import { THAAT_TO_CONFIG, detectThaat } from '@/app/utils/thaatMap';

const SWAR_SEQUENCE = [
  'Sa',
  'Re',
  'Ga',
  'Ma',
  'Pa',
  'Dha',
  'Ni',
  'Sa',
  'Re',
  'Ga',
  'Ma',
  'Pa',
];

const PLAY_KEYBOARD_LAYOUT = [
  { saKey: 'q', baseOctave: 3, keys: ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']'] },
  { saKey: 'a', baseOctave: 4, keys: ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'", '\\'] },
] as const;
const TONIC_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='] as const;
const SWAR_CONTROLS: Array<{
  key: keyof SwarConfig;
  label: string;
  options: Array<{ value: number; label: string }>;
}> = [
  {
    key: 're',
    label: 'Re',
    options: [
      { value: 1, label: 'Komal' },
      { value: 2, label: 'Shuddha' },
    ],
  },
  {
    key: 'ga',
    label: 'Ga',
    options: [
      { value: 3, label: 'Komal' },
      { value: 4, label: 'Shuddha' },
    ],
  },
  {
    key: 'ma',
    label: 'Ma',
    options: [
      { value: 5, label: 'Shuddha' },
      { value: 6, label: 'Teevra' },
    ],
  },
  {
    key: 'dha',
    label: 'Dha',
    options: [
      { value: 8, label: 'Komal' },
      { value: 9, label: 'Shuddha' },
    ],
  },
  {
    key: 'ni',
    label: 'Ni',
    options: [
      { value: 10, label: 'Komal' },
      { value: 11, label: 'Shuddha' },
    ],
  },
];

const SWAR_CONTROL_BY_KEY: Record<keyof SwarConfig, (typeof SWAR_CONTROLS)[number]> = {
  re: SWAR_CONTROLS[0],
  ga: SWAR_CONTROLS[1],
  ma: SWAR_CONTROLS[2],
  dha: SWAR_CONTROLS[3],
  ni: SWAR_CONTROLS[4],
};

const SWAR_SELECTOR_ITEMS: Array<
  | { id: string; type: 'fixed'; label: string; valueLabel: string }
  | { id: string; type: 'control'; key: keyof SwarConfig }
> = [
  { id: 're', type: 'control', key: 're' },
  { id: 'ga', type: 'control', key: 'ga' },
  { id: 'ma', type: 'control', key: 'ma' },
  { id: 'dha', type: 'control', key: 'dha' },
  { id: 'ni', type: 'control', key: 'ni' },
];

// Render enough octaves so the visible note range includes A1..A6.
// This also ensures the bottom-docked piano shows the requested lowest/highest notes.
const LOWEST_MIDI = 45; // A2
const HIGHEST_MIDI = 93; // A6

const pianoKeys = Array.from(
  { length: HIGHEST_MIDI - LOWEST_MIDI + 1 },
  (_, i) => {
    const midi = LOWEST_MIDI + i;
    const semitone = midi % 12;
    const octave = Math.floor(midi / 12) - 1;
    const name = NOTES[semitone];
    return {
      note: `${name}${octave}`,
      black: name.includes('#'),
    };
  }
);

function getSwarLabel(note: string, tonic: string, config: SwarConfig) {
  const name = note.slice(0, -1);
  let diff = noteIndex(name) - noteIndex(tonic);
  if (diff < 0) diff += 12;

  const swarByInterval: Record<number, string> = {
    0: 'Sa',
    [config.re]: 'Re',
    [config.ga]: 'Ga',
    [config.ma]: 'Ma',
    7: 'Pa',
    [config.dha]: 'Dha',
    [config.ni]: 'Ni',
  };

  return swarByInterval[diff] ?? '';
}

export default function Piano() {
  const pressed = useRef(new Set<string>());
  const activePointers = useRef(new Map<number, string>());

  const [tonic, setTonic] = useState('C');
  const [config, setConfig] = useState<SwarConfig>(DEFAULT_SWAR_CONFIG);
  const [thaat, setThaat] = useState('bilawal');
  const [active, setActive] = useState<Set<string>>(new Set());
  const [octaveOffset, setOctaveOffset] = useState(0);
  const [tonicIndex, setTonicIndex] = useState(NOTES.indexOf('C'));

  const getInterval = useCallback(
    (s: string) => {
      switch (s) {
        case 'Sa':
          return 0;
        case 'Re':
          return config.re;
        case 'Ga':
          return config.ga;
        case 'Ma':
          return config.ma;
        case 'Pa':
          return 7;
        case 'Dha':
          return config.dha;
        case 'Ni':
          return config.ni;
        default:
          return 0;
      }
    },
    [config]
  );

  const keyboardBindings = useMemo(() => {
    return PLAY_KEYBOARD_LAYOUT.flatMap((row) =>
      row.keys.map((key, idx) => {
        const swar = SWAR_SEQUENCE[idx];
        const interval = getInterval(swar);
        let n = noteIndex(tonic) + interval;
        let octave = row.baseOctave + octaveOffset + Math.floor(idx / 7);

        if (n >= 12) {
          n -= 12;
          octave++;
        }

        return {
          key,
          note: `${NOTES[n]}${octave}`,
        };
      })
    );
  }, [getInterval, tonic, octaveOffset]);

  const keyToNote = useMemo(() => {
    const map = new Map<string, string>();
    keyboardBindings.forEach((binding) => {
      map.set(binding.key, binding.note);
    });
    return map;
  }, [keyboardBindings]);

  const tonicKeyToNote = useMemo(() => {
    const map = new Map<string, string>();
    TONIC_KEYS.forEach((key, idx) => {
      map.set(key, NOTES[idx]);
    });
    return map;
  }, []);

  const getMidiFromNote = (note: string) => {
    const name = note.slice(0, -1);
    const octave = Number(note.slice(-1));
    const semitone = noteIndex(name);
    return (octave + 1) * 12 + semitone;
  };

  const playNote = useCallback(async (note: string | null) => {
    if (!note) return;

    setActive((p) => new Set(p).add(note));
    await initSF2();
    playSF2(getMidiFromNote(note));
  }, []);

  const stopNote = useCallback((note: string | null) => {
    if (!note) return;

    setActive((p) => {
      const n = new Set(p);
      n.delete(note);
      return n;
    });
  }, []);

  const toggleSwar = useCallback((swarKey: keyof SwarConfig) => {
    const control = SWAR_CONTROL_BY_KEY[swarKey];
    const currentValue = config[swarKey];
    const currentOptionIndex = control.options.findIndex(opt => opt.value === currentValue);
    const nextOptionIndex = (currentOptionIndex + 1) % control.options.length;
    const nextValue = control.options[nextOptionIndex].value;
    
    setConfig(prev => ({
      ...prev,
      [swarKey]: nextValue as SwarConfig[typeof swarKey]
    }));
  }, [config]);

  const shiftTonic = useCallback((direction: 'up' | 'down') => {
    const delta = direction === 'up' ? 1 : -1;
    const newIndex = (tonicIndex + delta + NOTES.length) % NOTES.length;
    setTonicIndex(newIndex);
    setTonic(NOTES[newIndex]);
  }, [tonicIndex]);

  const shiftOctave = useCallback((direction: 'up' | 'down') => {
    const delta = direction === 'up' ? 1 : -1;
    setOctaveOffset(prev => prev + delta);
  }, []);

  useEffect(() => {
    const down = async (e: KeyboardEvent) => {
      const keyboardKey = e.key.toLowerCase();
      
      // Handle tonic selection (1-7 keys)
      const tonicFromKey = tonicKeyToNote.get(keyboardKey);
      if (tonicFromKey) {
        setTonic(tonicFromKey);
        return;
      }

      // Handle swar toggles
      switch (keyboardKey) {
        case 'z':
          toggleSwar('re');
          return;
        case 'x':
          toggleSwar('ga');
          return;
        case 'c':
          toggleSwar('ma');
          return;
        case 'v':
          toggleSwar('dha');
          return;
        case 'b':
          toggleSwar('ni');
          return;
        case 'n':
          shiftTonic('down');
          return;
        case 'm':
          shiftTonic('up');
          return;
        case ',':
          shiftOctave('down');
          return;
        case '.':
          shiftOctave('up');
          return;
      }

      if (pressed.current.has(keyboardKey)) return;

      const note = keyToNote.get(keyboardKey);
      if (!note) return;

      pressed.current.add(keyboardKey);
      await playNote(note);
    };

    const up = (e: KeyboardEvent) => {
      const keyboardKey = e.key.toLowerCase();
      const note = keyToNote.get(keyboardKey);
      pressed.current.delete(keyboardKey);
      stopNote(note ?? null);
    };

    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);

    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [keyToNote, playNote, stopNote, tonicKeyToNote, toggleSwar, shiftTonic, shiftOctave]);

  useEffect(() => {
    setThaat(detectThaat(config));
  }, [config]);

  useEffect(() => {
    setTonicIndex(NOTES.indexOf(tonic));
  }, [tonic]);

  const handleThaatChange = (t: string) => {
    if (!THAAT_TO_CONFIG[t]) return;
    setThaat(t);
    setConfig(THAAT_TO_CONFIG[t]);
  };

  const handlePointerDown = async (
    e: PointerEvent<HTMLButtonElement>,
    note: string
  ) => {
    e.preventDefault();
    activePointers.current.set(e.pointerId, note);
    await playNote(note);
  };

  const handlePointerUp = (
    e: PointerEvent<HTMLButtonElement>,
    note: string
  ) => {
    e.preventDefault();
    activePointers.current.delete(e.pointerId);
    stopNote(note);
  };

  const handlePointerLeave = (
    e: PointerEvent<HTMLButtonElement>,
    note: string
  ) => {
    if (activePointers.current.get(e.pointerId) !== note) return;
    activePointers.current.delete(e.pointerId);
    stopNote(note);
  };

  return (
    <div className="container">
      <div className="controls-panel">
        <div className="top-controls">
          <div className="control-card">
            <div className="control-header">
              <svg className="control-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
              </svg>
              <div className="control-title">Tonic</div>
            </div>
            <div className="toggle-group" role="group" aria-label="Select tonic">
              {NOTES.map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`toggle-btn ${tonic === n ? 'selected' : ''}`}
                  onClick={() => setTonic(n)}
                  aria-pressed={tonic === n}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div className="control-card">
            <div className="control-header">
              <svg className="control-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              <div className="control-title">Thaat</div>
            </div>
            <div className="toggle-group" role="group" aria-label="Select thaat">
              {Object.keys(THAAT_TO_CONFIG).map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`toggle-btn ${thaat === t ? 'selected' : ''}`}
                  onClick={() => handleThaatChange(t)}
                  aria-pressed={thaat === t}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="control-card swar-modifier">
          <div className="control-header">
            <svg className="control-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 17V7h2v10H3zm4 0V7h2v10H7zm4 0V7h2v10h-2zm4 0V7h2v10h-2z"/>
            </svg>
            <div className="control-title">Swar Modifier</div>
          </div>
          <div className="swar-grid">
            {SWAR_SELECTOR_ITEMS.map((item) => {
              if (item.type === 'fixed') {
                return (
                  <div key={item.id} className="swar-block">
                    <div className="swar-label">{item.label}</div>
                    <div className="toggle-group tight" role="group" aria-label={`${item.label} fixed`}>
                      <button
                        type="button"
                        className="toggle-btn selected locked"
                        aria-pressed={true}
                        disabled
                      >
                        {item.valueLabel}
                      </button>
                    </div>
                  </div>
                );
              }

              const control = SWAR_CONTROL_BY_KEY[item.key];
              return (
                <div key={item.id} className="swar-block">
                  <div className="swar-label">{control.label}</div>
                  <div
                    className="toggle-group tight"
                    role="group"
                    aria-label={`Select ${control.label}`}
                  >
                    {control.options.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={`toggle-btn ${config[control.key] === option.value ? 'selected' : ''}`}
                        onClick={() =>
                          setConfig((prev) => ({
                            ...prev,
                            [control.key]: option.value as SwarConfig[typeof control.key],
                          }))
                        }
                        aria-pressed={config[control.key] === option.value}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="piano-dock">
        <div className="hint">
          <div className="hint-section">
            <span className="hint-label">Play:</span>
            <kbd className="hint-key">Q/A</kbd> rows
          </div>
          <div className="hint-section">
            <span className="hint-label">Tonic:</span>
            <kbd className="hint-key">1-7</kbd> keys
          </div>
          <div className="hint-section">
            <span className="hint-label">Swar:</span>
            <kbd className="hint-key">Z/X/C/V/B</kbd>
          </div>
          <div className="hint-section">
            <span className="hint-label">Shift:</span>
            <kbd className="hint-key">N/M</kbd> tonic, <kbd className="hint-key">,/.</kbd> octave
          </div>
        </div>
        <div className="piano-shell">
          <div className="piano">
          {(() => {
            let whiteIndex = 0;
            return pianoKeys.map((k) => {
            const activeKey = active.has(k.note);

            if (!k.black) {
              whiteIndex++;
              return (
                <button
                  key={k.note}
                  className={`white ${activeKey ? 'active' : ''}`}
                  onPointerDown={(e) => handlePointerDown(e, k.note)}
                  onPointerUp={(e) => handlePointerUp(e, k.note)}
                  onPointerCancel={(e) => handlePointerUp(e, k.note)}
                  onPointerLeave={(e) => handlePointerLeave(e, k.note)}
                  type="button"
                  aria-label={`${k.note} ${getSwarLabel(k.note, tonic, config)}`}
                >
                  <span className="label">{getSwarLabel(k.note, tonic, config)}</span>
                </button>
              );
            } else {
              return (
                <button
                  key={k.note}
                  className={`black ${activeKey ? 'active' : ''}`}
                  style={{
                    left: `calc(${whiteIndex} * var(--white-w) - (var(--black-w) / 2))`,
                  }}
                  onPointerDown={(e) => handlePointerDown(e, k.note)}
                  onPointerUp={(e) => handlePointerUp(e, k.note)}
                  onPointerCancel={(e) => handlePointerUp(e, k.note)}
                  onPointerLeave={(e) => handlePointerLeave(e, k.note)}
                  type="button"
                  aria-label={`${k.note} ${getSwarLabel(k.note, tonic, config)}`}
                >
                  <span className="label">{getSwarLabel(k.note, tonic, config)}</span>
                </button>
              );
            }
            });
          })()}
          </div>
        </div>
      </div>
    </div>
  );
}
