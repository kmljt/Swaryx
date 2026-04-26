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
import { initSF2 as initSoundEngine, playSF2 as playSoundNote, stopSF2 as stopSoundNote, testSF2Engine } from '@/app/audio/sf2Engine';
import { DEFAULT_SWAR_CONFIG, SwarConfig } from '@/app/utils/swarConfig';
import { THAAT_TO_CONFIG, detectThaat, THAAT_TO_MELAKARTA } from '@/app/utils/thaatMap';
import { MELAKARTA_TO_CONFIG, detectMelakarta } from '@/app/utils/melakartaMap';
import { MELAKARTA_TO_WESTERN } from '@/app/utils/melakartaToWestern';

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
  'Dha',
];

const PLAY_KEYBOARD_LAYOUT = [
  { saKey: 'q', baseOctave: 3, keys: ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']', '\\'] },
  { saKey: 'a', baseOctave: 4, keys: ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';', "'", 'enter'] },
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

  // Helper function to get swar notation
  const getSwarNotation = (swar: string, value: number) => {
    switch (swar) {
      case 're':
        if (value === 1) return 'r'; // komal
        if (value === 2) return 'R'; // shuddha
        break;
      case 'ga':
        if (value === 3) return 'g'; // komal
        if (value === 4) return 'G'; // shuddha
        break;
      case 'ma':
        if (value === 5) return 'M'; // shuddha
        if (value === 6) return 'M^'; // teevra
        break;
      case 'dha':
        if (value === 8) return 'd'; // komal
        if (value === 9) return 'D'; // shuddha
        break;
      case 'ni':
        if (value === 10) return 'n'; // komal
        if (value === 11) return 'N'; // shuddha
        break;
    }
    return '';
  };

  const swarByInterval: Record<number, string> = {
    0: 'S',
    [config.re]: getSwarNotation('re', config.re),
    [config.ga]: getSwarNotation('ga', config.ga),
    [config.ma]: getSwarNotation('ma', config.ma),
    7: 'P',
    [config.dha]: getSwarNotation('dha', config.dha),
    [config.ni]: getSwarNotation('ni', config.ni),
  };

  return swarByInterval[diff] ?? '';
}

function getSwarClass(note: string, tonic: string, config: SwarConfig) {
  return 'label';
}

export default function Piano() {
  const pressed = useRef(new Set<string>());
  const activePointers = useRef(new Map<number, string>());
  const melakartaListRef = useRef<HTMLDivElement>(null);

  const [tonic, setTonic] = useState('C');
  const [config, setConfig] = useState<SwarConfig>(DEFAULT_SWAR_CONFIG);
  const [thaat, setThaat] = useState('bilawal');
  const [melakarta, setMelakarta] = useState('shankarabharanam');
  const [melakartaIndex, setMelakartaIndex] = useState(0);
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

  const getWesternMode = useMemo(() => {
    // Map swar configurations to Western mode names
    const modeMap: Record<string, string> = {
      '2-4-5-9-11': 'Major/Ionian',
      '2-3-5-9-10': 'Dorian',
      '1-4-5-8-11': 'Phrygian',
      '2-4-6-9-11': 'Lydian',
      '2-4-5-9-10': 'Mixolydian',
      '2-3-5-8-10': 'Aeolian/Minor',
      '1-3-5-8-10': 'Locrian',
      '1-4-5-8-10': 'Harmonic Minor',
      '1-3-6-8-10': 'Melodic Minor',
      '1-4-6-9-11': 'Lydian Dominant',
      '2-3-6-9-10': 'Mixolydian b6',
      '1-3-6-8-11': 'Locrian #2',
      '1-4-6-8-11': 'Altered',
      '2-4-6-9-10': 'Lydian Augmented',
      '1-4-5-8-9': 'Dorian b2',
      '2-3-5-8-11': 'Mixolydian b9',
      '1-3-5-9-10': 'Aeolian b5',
      '2-4-5-8-11': 'Ionian #5',
      '1-4-6-8-10': 'Melodic Minor #4',
      '2-3-6-8-11': 'Harmonic Minor #5',
      '1-3-6-9-11': 'Super Locrian',
      '2-4-6-8-11': 'Lydian b7',
      '1-4-5-9-11': 'Mixolydian #4',
      '2-3-5-9-11': 'Dorian #4',
      '1-4-6-9-10': 'Lydian b6',
      '2-3-6-9-11': 'Mixolydian b2',
      '1-3-5-8-9': 'Locrian b6',
      '2-4-5-8-10': 'Ionian b5',
      '1-4-5-9-10': 'Dorian b5',
      '2-3-6-8-10': 'Melodic Minor b6',
      '1-4-6-8-9': 'Harmonic Minor b5',
      '1-3-6-9-10': 'Super Locrian b7',
      '2-4-6-8-10': 'Lydian b5',
      '2-3-5-8-9': 'Aeolian b9',
      '1-3-5-9-11': 'Locrian #6',
    };

    const key = `${config.re}-${config.ga}-${config.ma}-${config.dha}-${config.ni}`;
    return modeMap[key] || 'Custom';
  }, [config]);

  const melakartaName = useMemo(() => detectMelakarta(config), [config]);

  const westernMapping = useMemo(() => {
    const key = (melakartaName || '').toLowerCase();
    const val = MELAKARTA_TO_WESTERN[key];
    return val || getWesternMode;
  }, [melakartaName, getWesternMode]);

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
    await initSoundEngine();
    await playSoundNote(getMidiFromNote(note));
  }, []);

  const stopNote = useCallback((note: string | null) => {
    if (!note) return;

    setActive((p) => {
      const n = new Set(p);
      n.delete(note);
      return n;
    });
    stopSoundNote(getMidiFromNote(note));
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
    const detectedThaat = detectThaat(config);
    setThaat(detectedThaat);
    
    const detectedMelakarta = detectMelakarta(config);
    setMelakarta(detectedMelakarta);
  }, [config]);

  useEffect(() => {
    setTonicIndex(NOTES.indexOf(tonic));
  }, [tonic]);

  // Auto-scroll to selected melakarta
  useEffect(() => {
    if (melakartaListRef.current) {
      // Small delay to ensure DOM is updated
      const timeoutId = setTimeout(() => {
        const selectedItem = melakartaListRef.current?.querySelector('.melakarta-item.selected');
        if (selectedItem) {
          selectedItem.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
          });
        }
      }, 50);
      
      return () => clearTimeout(timeoutId);
    }
  }, [melakarta]);

  const handleThaatChange = (t: string) => {
    if (!THAAT_TO_CONFIG[t]) return;
    setThaat(t);
    setConfig(THAAT_TO_CONFIG[t]);
    // Also set the equivalent melakarta
    const equivalentMelakarta = THAAT_TO_MELAKARTA[t];
    if (equivalentMelakarta) {
      setMelakarta(equivalentMelakarta);
      // Set the slider to the correct position
      const melakartaNames = Object.keys(MELAKARTA_TO_CONFIG);
      const index = melakartaNames.indexOf(equivalentMelakarta);
      if (index >= 0) {
        setMelakartaIndex(index);
      }
    }
  };

  const handleMelakartaChange = (m: string) => {
    if (!MELAKARTA_TO_CONFIG[m]) return;
    setMelakarta(m);
    setConfig(MELAKARTA_TO_CONFIG[m]);
    // Set the slider to the correct position
    const melakartaNames = Object.keys(MELAKARTA_TO_CONFIG);
    const index = melakartaNames.indexOf(m);
    if (index >= 0) {
      setMelakartaIndex(index);
    }
  };

  const handlePointerDown = async (
    e: PointerEvent<HTMLButtonElement>,
    note: string
  ) => {
    e.preventDefault();
    activePointers.current.set(e.pointerId, note);
    await playSoundNote(getMidiFromNote(note));
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
        <div className="left-controls">
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
                <button
                  key="custom"
                  type="button"
                  className={`toggle-btn ${thaat === 'custom' ? 'selected' : ''}`}
                  onClick={() => handleThaatChange('custom')}
                  aria-pressed={thaat === 'custom'}
                >
                  Custom
                </button>
              </div>
            </div>

            <div className="control-card">
              <div className="control-header">
                <svg className="control-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 3v1H4v2h1v13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V6h1V4h-5V3H9zM7 6h6v13H7V6z"/>
                </svg>
                <div className="control-title">Melakarta</div>
              </div>
              <div className="melakarta-selector">
                <div className="melakarta-list" ref={melakartaListRef}>
                  {Object.entries(MELAKARTA_TO_CONFIG).map(([name, config], index) => (
                    <button
                      key={name}
                      type="button"
                      className={`melakarta-item ${melakarta === name ? 'selected' : ''}`}
                      onClick={() => handleMelakartaChange(name)}
                      title={name.charAt(0).toUpperCase() + name.slice(1)}
                    >
                      {name.charAt(0).toUpperCase() + name.slice(1)}
                    </button>
                  ))}
                  <button
                    key="custom"
                    type="button"
                    className={`melakarta-item ${melakarta === 'custom' ? 'selected' : ''}`}
                    onClick={() => handleMelakartaChange('custom')}
                    title="Custom"
                  >
                    Custom
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="swar-modifier">
            <div className="control-card swar-modifier-container">
              <div className="control-header">
                <svg className="control-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z"/>
                </svg>
                <div className="control-title">Swar Modifier</div>
              </div>
              <div className="swar-modern-grid">
                {/* Sa - Fixed */}
                <div className="swar-modern-column fixed">
                  <div className="swar-modern-header fixed">
                    SA
                  </div>
                  <div className="swar-modern-options fixed">
                    <div className="swar-modern-option fixed">
                      Fixed
                    </div>
                  </div>
                </div>
                
                {/* Re - Variable */}
                <div className="swar-modern-column">
                  <div className="swar-modern-header">
                    RE
                  </div>
                  <div className="swar-modern-options">
                    {SWAR_CONTROLS[0].options.map((option) => {
                      const isActive = config.re === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          className={`swar-modern-option ${isActive ? 'active' : ''}`}
                          onClick={() => toggleSwar('re')}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                
                {/* Ga - Variable */}
                <div className="swar-modern-column">
                  <div className="swar-modern-header">
                    GA
                  </div>
                  <div className="swar-modern-options">
                    {SWAR_CONTROLS[1].options.map((option) => {
                      const isActive = config.ga === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          className={`swar-modern-option ${isActive ? 'active' : ''}`}
                          onClick={() => toggleSwar('ga')}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                
                {/* Ma - Variable */}
                <div className="swar-modern-column">
                  <div className="swar-modern-header">
                    MA
                  </div>
                  <div className="swar-modern-options">
                    {SWAR_CONTROLS[2].options.map((option) => {
                      const isActive = config.ma === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          className={`swar-modern-option ${isActive ? 'active' : ''}`}
                          onClick={() => toggleSwar('ma')}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                
                {/* Pa - Fixed */}
                <div className="swar-modern-column fixed">
                  <div className="swar-modern-header fixed">
                    PA
                  </div>
                  <div className="swar-modern-options fixed">
                    <div className="swar-modern-option fixed">
                      Fixed
                    </div>
                  </div>
                </div>
                
                {/* Dha - Variable */}
                <div className="swar-modern-column">
                  <div className="swar-modern-header">
                    DHA
                  </div>
                  <div className="swar-modern-options">
                    {SWAR_CONTROLS[3].options.map((option) => {
                      const isActive = config.dha === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          className={`swar-modern-option ${isActive ? 'active' : ''}`}
                          onClick={() => toggleSwar('dha')}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                
                {/* Ni - Variable */}
                <div className="swar-modern-column">
                  <div className="swar-modern-header">
                    NI
                  </div>
                  <div className="swar-modern-options">
                    {SWAR_CONTROLS[4].options.map((option) => {
                      const isActive = config.ni === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          className={`swar-modern-option ${isActive ? 'active' : ''}`}
                          onClick={() => toggleSwar('ni')}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="info-card">
          <div className="info-grid">
            <div className="info-item">
              <div className="info-label">Tonic</div>
              <div className="info-value">{tonic}</div>
            </div>
            <div className="info-item">
              <div className="info-label">Hindustani</div>
              <div className="info-value">{thaat.charAt(0).toUpperCase() + thaat.slice(1)}</div>
            </div>
            <div className="info-item">
              <div className="info-label">Carnatic</div>
              <div className="info-value">{melakarta.charAt(0).toUpperCase() + melakarta.slice(1)}</div>
            </div>
            <div className="info-item">
              <div className="info-label">Western</div>
              <div className="info-value">{westernMapping}</div>
            </div>
            <div className="info-item">
              <div className="info-label">Octave</div>
              <div className="info-value">{octaveOffset >= 0 ? '+' : ''}{octaveOffset}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="piano-dock">
        <div className="hint">
          <div className="hint-straight">
            <span className="hint-text">
              <span className="hint-group">Play: <kbd className="hint-key">Q</kbd> and <kbd className="hint-key">A</kbd> rows</span>
              <span className="hint-separator">•</span>
              <span className="hint-group">Toggle Swars: <kbd className="hint-key">Z</kbd><kbd className="hint-key">X</kbd><kbd className="hint-key">C</kbd><kbd className="hint-key">V</kbd><kbd className="hint-key">B</kbd></span>
              <span className="hint-separator">•</span>
              <span className="hint-group">Select Tonic: <kbd className="hint-key">1</kbd> to <kbd className="hint-key">=</kbd> keys</span>
              <span className="hint-separator">•</span>
              <span className="hint-group">Shift Tonic: <kbd className="hint-key">N</kbd> or <kbd className="hint-key">M</kbd></span>
              <span className="hint-separator">•</span>
              <span className="hint-group">Shift Octave: <kbd className="hint-key">&lt;</kbd> or <kbd className="hint-key">&gt;</kbd></span>
            </span>
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
                  <span key={getSwarLabel(k.note, tonic, config)} className={getSwarClass(k.note, tonic, config)}>{getSwarLabel(k.note, tonic, config)}</span>
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
                  <span key={getSwarLabel(k.note, tonic, config)} className={getSwarClass(k.note, tonic, config)}>{getSwarLabel(k.note, tonic, config)}</span>
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
