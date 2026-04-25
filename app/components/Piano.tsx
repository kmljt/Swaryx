'use client';

import { useEffect, useRef, useState } from 'react';
import { NOTES, noteIndex } from '@/app/utils/notes';
import { noteToMidi } from '@/app/utils/midiMap';
import { initSF2, playSF2 } from '@/app/audio/sf2Engine';
import { DEFAULT_SWAR_CONFIG, SwarConfig } from '@/app/utils/swarConfig';
import { THAAT_TO_CONFIG, detectThaat } from '@/app/utils/thaatMap';

const keyOrder = ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '[', ']'];
const swarOrder = [
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

const keys = [
  'C',
  'C#',
  'D',
  'D#',
  'E',
  'F',
  'F#',
  'G',
  'G#',
  'A',
  'A#',
  'B',
  'C',
  'C#',
  'D',
  'D#',
  'E',
  'F',
].map((n, i) => ({
  note: `${n}${i < 12 ? 4 : 5}`,
  black: n.includes('#'),
}));

function getSwarLabel(note: string, tonic: string) {
  const name = note.slice(0, -1);
  let diff = noteIndex(name) - noteIndex(tonic);
  if (diff < 0) diff += 12;

  return (
    ['S', 'r', 'R', 'g', 'G', 'M', 'M+', 'P', 'd', 'D', 'n', 'N'][diff] || ''
  );
}

export default function Piano() {
  const pressed = useRef(new Set<string>());

  const [tonic, setTonic] = useState('C');
  const [config, setConfig] = useState<SwarConfig>(DEFAULT_SWAR_CONFIG);
  const [thaat, setThaat] = useState('bilawal');
  const [active, setActive] = useState<Set<string>>(new Set());

  const getInterval = (s: string) => {
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
  };

  const getNote = (key: string) => {
    const idx = keyOrder.indexOf(key);
    if (idx === -1) return null;

    const swar = swarOrder[idx];
    const interval = getInterval(swar);

    let n = noteIndex(tonic) + interval;
    let octave = idx < 7 ? 4 : 5;

    if (n >= 12) {
      n -= 12;
      octave++;
    }

    return `${NOTES[n]}${octave}`;
  };

  const play = async (key: string) => {
    const note = getNote(key);
    if (!note) return;

    setActive((p) => new Set(p).add(note));
    await initSF2();
    playSF2(noteToMidi[note]);
  };

  const stop = (key: string) => {
    const note = getNote(key);
    if (!note) return;

    setActive((p) => {
      const n = new Set(p);
      n.delete(note);
      return n;
    });
  };

  useEffect(() => {
    const down = async (e: KeyboardEvent) => {
      if (pressed.current.has(e.key)) return;
      pressed.current.add(e.key);
      await play(e.key);
    };

    const up = (e: KeyboardEvent) => {
      pressed.current.delete(e.key);
      stop(e.key);
    };

    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);

    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [tonic, config]);

  useEffect(() => {
    setThaat(detectThaat(config));
  }, [config]);

  const handleThaatChange = (t: string) => {
    if (!THAAT_TO_CONFIG[t]) return;
    setThaat(t);
    setConfig(THAAT_TO_CONFIG[t]);
  };

  let whiteIndex = 0;

  const blackOffsets: Record<string, number> = {
    'C#': 40,
    'D#': 100,
    'F#': 220,
    'G#': 280,
    'A#': 340,
  };

  return (
    <div className="container">
      <div className="controls">
        <select value={tonic} onChange={(e) => setTonic(e.target.value)}>
          {NOTES.map((n) => (
            <option key={n}>{n}</option>
          ))}
        </select>

        <select
          value={thaat}
          onChange={(e) => handleThaatChange(e.target.value)}
        >
          {Object.keys(THAAT_TO_CONFIG).map((t) => (
            <option key={t}>{t}</option>
          ))}
          <option value="custom">Custom</option>
        </select>
      </div>

      <div className="controls">
        {['re', 'ga', 'ma', 'dha', 'ni'].map((s) => (
          <select
            key={s}
            value={(config as any)[s]}
            onChange={(e) =>
              setConfig({ ...config, [s]: Number(e.target.value) })
            }
          >
            {s === 'ma' ? (
              <>
                <option value={5}>Shuddha</option>
                <option value={6}>Teevra</option>
              </>
            ) : (
              <>
                <option
                  value={s === 're' ? 1 : s === 'ga' ? 3 : s === 'dha' ? 8 : 10}
                >
                  Komal
                </option>
                <option
                  value={s === 're' ? 2 : s === 'ga' ? 4 : s === 'dha' ? 9 : 11}
                >
                  Shuddha
                </option>
              </>
            )}
          </select>
        ))}
      </div>

      <div className="piano">
        {keys.map((k, i) => {
          const activeKey = active.has(k.note);

          if (!k.black) {
            whiteIndex++;
            return (
              <div
                key={k.note}
                className={`white ${activeKey ? 'active' : ''}`}
              >
                <span className="label">{getSwarLabel(k.note, tonic)}</span>
              </div>
            );
          } else {
            const name = k.note.slice(0, -1);
            return (
              <div
                key={k.note}
                className={`black ${activeKey ? 'active' : ''}`}
                style={{ left: blackOffsets[name] + (i >= 12 ? 360 : 0) }}
              >
                <span className="label">{getSwarLabel(k.note, tonic)}</span>
              </div>
            );
          }
        })}
      </div>
    </div>
  );
}
