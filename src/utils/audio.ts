import * as Tone from "tone";

export type SEType =
  | "attack"
  | "magic"
  | "damage"
  | "decision"
  | "cancel"
  | "gacha"
  | "levelup"
  | "victory";

export type BGMType =
  | "home"
  | "field"
  | "village"
  | "dungeon"
  | "battle"
  | "boss"
  | "lastboss";

let unlocked = false;
let currentBGM: BGMType | null = null;

interface BgmHandles {
  parts: Tone.Part[];
  synths: Array<Tone.PolySynth | Tone.Synth | Tone.MembraneSynth>;
  effects: Tone.ToneAudioNode[];
}

let bgmHandles: BgmHandles = { parts: [], synths: [], effects: [] };

export const unlockAudio = async (): Promise<void> => {
  if (unlocked) return;
  await Tone.start();
  unlocked = true;
};

export const playSE = (type: SEType): void => {
  if (!unlocked) return;

  const now = Tone.now();

  switch (type) {
    case "attack": {
      const kick = new Tone.MembraneSynth({
        pitchDecay: 0.05,
        octaves: 6,
        envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.1 }
      }).toDestination();
      kick.triggerAttackRelease("C2", "8n", now);
      setTimeout(() => kick.dispose(), 600);
      break;
    }

    case "magic": {
      const synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "sine" },
        envelope: { attack: 0.01, decay: 0.3, sustain: 0.2, release: 0.5 }
      }).toDestination();
      synth.volume.value = -10;
      synth.triggerAttackRelease("Eb5", "8n", now);
      synth.triggerAttackRelease("Gb5", "8n", now + 0.08);
      synth.triggerAttackRelease("Bb5", "8n", now + 0.16);
      synth.triggerAttackRelease(["Eb5", "Gb5", "Bb5"], "4n", now + 0.28);
      setTimeout(() => synth.dispose(), 1200);
      break;
    }

    case "damage": {
      const noise = new Tone.NoiseSynth({
        noise: { type: "white" },
        envelope: { attack: 0.001, decay: 0.18, sustain: 0 }
      }).toDestination();
      const filter = new Tone.AutoFilter({
        frequency: 8,
        baseFrequency: 800,
        octaves: -3
      }).toDestination().start();
      noise.connect(filter);
      noise.triggerAttackRelease("8n", now);
      setTimeout(() => {
        noise.dispose();
        filter.dispose();
      }, 700);
      break;
    }

    case "decision": {
      const synth = new Tone.Synth({
        oscillator: { type: "triangle" },
        envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.1 }
      }).toDestination();
      synth.triggerAttackRelease("E5", "16n", now);
      synth.triggerAttackRelease("A5", "16n", now + 0.06);
      setTimeout(() => synth.dispose(), 500);
      break;
    }

    case "cancel": {
      const synth = new Tone.Synth({
        oscillator: { type: "sine" },
        envelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.1 }
      }).toDestination();
      synth.triggerAttackRelease("A3", "16n", now);
      synth.triggerAttackRelease("E3", "16n", now + 0.07);
      setTimeout(() => synth.dispose(), 500);
      break;
    }

    case "gacha": {
      const bell = new Tone.MetalSynth({
        envelope: { attack: 0.001, decay: 0.4, release: 0.2 },
        harmonicity: 5.1,
        modulationIndex: 32,
        resonance: 4000,
        octaves: 1.5
      }).toDestination();
      bell.volume.value = -12;
      bell.triggerAttackRelease("C6", "8n", now);
      bell.triggerAttackRelease("E6", "8n", now + 0.08);
      bell.triggerAttackRelease("G6", "8n", now + 0.16);
      setTimeout(() => bell.dispose(), 800);
      break;
    }

    case "levelup": {
      const synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "square" },
        envelope: { attack: 0.01, decay: 0.2, sustain: 0.3, release: 0.3 }
      }).toDestination();
      synth.volume.value = -8;
      synth.triggerAttackRelease("C5", "8n", now);
      synth.triggerAttackRelease("E5", "8n", now + 0.15);
      synth.triggerAttackRelease("G5", "8n", now + 0.3);
      synth.triggerAttackRelease("C6", "4n", now + 0.45);
      synth.triggerAttackRelease(["D4", "A4", "D5"], "4n", now);
      setTimeout(() => synth.dispose(), 1500);
      break;
    }

    case "victory": {
      const synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "triangle" },
        envelope: { attack: 0.005, decay: 0.18, sustain: 0.25, release: 0.35 }
      }).toDestination();
      synth.volume.value = -10;
      synth.triggerAttackRelease("Eb5", "16n", now);
      synth.triggerAttackRelease("Bb5", "16n", now + 0.1);
      synth.triggerAttackRelease("Eb6", "8n", now + 0.22);
      setTimeout(() => synth.dispose(), 800);
      break;
    }
  }
};

// ============================================================
// BGM melody data  (Eb minor pentatonic = Eb/Gb/Ab/Bb/Db)
// ============================================================

// --- home (BPM 74, melancholic field/hub) ---
const homeMelody: Array<[string, string]> = [
  ["0:0", "Eb5"], ["0:2", "Gb5"],
  ["1:0", "Bb4"], ["1:2", "Ab4"],
  ["2:0", "Db5"], ["2:2", "Eb5"],
  ["3:0", "Bb4"], ["3:2", "Eb4"]
];
const homeBassLine: Array<[string, string]> = [
  ["0:0", "Eb3"], ["1:0", "B2"], ["2:0", "Db3"], ["3:0", "Eb3"]
];

// --- village (BPM 110, bright/comforting) ---
const villageMelody: Array<[string, string]> = [
  ["0:0", "Eb5"], ["0:1", "Gb5"], ["0:2", "Bb5"], ["0:3", "Ab5"],
  ["1:0", "Gb5"], ["1:1", "Eb5"], ["1:2", "Db5"], ["1:3", "Eb5"],
  ["2:0", "Bb4"], ["2:1", "Db5"], ["2:2", "Eb5"], ["2:3", "Gb5"],
  ["3:0", "Ab5"], ["3:1", "Gb5"], ["3:2", "Eb5"], ["3:3", "Db5"]
];
const villageBassLine: Array<[string, string]> = [
  ["0:0", "Eb3"], ["1:0", "Bb2"], ["2:0", "Gb2"], ["3:0", "Ab2"]
];

// --- field (BPM 100, rhythmic adventure) ---
const fieldMelody: Array<[string, string]> = [
  ["0:0", "Bb4"], ["0:0.5", "Db5"], ["0:1", "Eb5"], ["0:2", "Gb5"], ["0:3", "Bb5"],
  ["1:0", "Ab5"], ["1:1", "Gb5"],   ["1:2", "Eb5"], ["1:3", "Db5"],
  ["2:0", "Eb5"], ["2:0.5", "Gb5"], ["2:1", "Ab5"], ["2:2", "Gb5"], ["2:3", "Eb5"],
  ["3:0", "Db5"], ["3:1", "Bb4"],   ["3:2", "Eb5"], ["3:3", "Db5"]
];
const fieldBassLine: Array<[string, string]> = [
  ["0:0", "Eb2"], ["0:2", "Eb2"],
  ["1:0", "Bb1"], ["1:2", "Bb1"],
  ["2:0", "Gb2"], ["2:2", "Gb2"],
  ["3:0", "Ab2"], ["3:2", "Ab2"]
];

// --- dungeon (BPM 75, heavy/creeping) ---
const dungeonMelody: Array<[string, string]> = [
  ["0:0", "Eb4"], ["0:2", "Db4"],
  ["1:0", "Bb3"], ["1:2", "Gb3"],
  ["2:0", "Ab3"], ["2:2", "Eb3"],
  ["3:0", "Db4"], ["3:2", "Bb3"]
];
const dungeonBassLine: Array<[string, string]> = [
  ["0:0", "Eb2"], ["1:0", "Bb1"], ["2:0", "Gb1"], ["3:0", "Ab1"]
];

// --- battle (BPM 140, D minor, tense) ---
const battleMelody: Array<[string, string]> = [
  ["0:0", "D5"],  ["0:1", "F5"],  ["0:1.5", "A5"], ["0:2", "G5"],  ["0:2.5", "F5"], ["0:3", "D5"],  ["0:3.5", "E5"],
  ["1:0", "F5"],  ["1:1", "A5"],  ["1:1.5", "D6"], ["1:2", "C6"],  ["1:2.5", "A5"], ["1:3", "G5"],  ["1:3.5", "F5"],
  ["2:0", "E5"],  ["2:0.5", "D5"],["2:1", "C5"],   ["2:1.5", "D5"],["2:2", "F5"],   ["2:2.5", "G5"],["2:3", "A5"],   ["2:3.5", "G5"],
  ["3:0", "F5"],  ["3:1", "E5"],  ["3:1.5", "D5"], ["3:2", "C#5"], ["3:2.5", "D5"], ["3:3", "A4"]
];
const battleBassLine: Array<[string, string]> = [
  ["0:0", "D2"],  ["0:1", "D2"],  ["0:2", "D2"],  ["0:3", "D2"],
  ["1:0", "Bb1"], ["1:1", "Bb1"], ["1:2", "Bb1"], ["1:3", "Bb1"],
  ["2:0", "F2"],  ["2:1", "F2"],  ["2:2", "F2"],  ["2:3", "F2"],
  ["3:0", "A1"],  ["3:1", "A1"],  ["3:2", "A1"],  ["3:3", "A1"]
];
const battleDrums: Array<[string, string]> = [
  ["0:0", "x"], ["0:1", "x"], ["0:2", "x"], ["0:3", "x"],
  ["1:0", "x"], ["1:1", "x"], ["1:2", "x"], ["1:3", "x"],
  ["2:0", "x"], ["2:1", "x"], ["2:2", "x"], ["2:3", "x"],
  ["3:0", "x"], ["3:1", "x"], ["3:2", "x"], ["3:3", "x"]
];

// --- boss (BPM 80, slow/heavy dramatic) ---
const bossMelody: Array<[string, string]> = [
  ["0:0", "Eb5"], ["0:1.5", "Db5"], ["0:2", "Bb4"], ["0:3", "Eb5"],
  ["1:0", "Gb5"], ["1:1", "Db5"],   ["1:2", "Eb5"], ["1:3", "Bb4"],
  ["2:0", "Ab4"], ["2:1", "Eb5"],   ["2:2", "Gb5"], ["2:3", "Bb5"],
  ["3:0", "Eb5"], ["3:1", "Db5"],   ["3:2", "Bb4"], ["3:3", "Gb4"]
];
const bossBassLine: Array<[string, string]> = [
  ["0:0", "Eb2"], ["0:2", "Db2"],
  ["1:0", "Gb1"], ["1:2", "Bb1"],
  ["2:0", "Ab1"], ["2:2", "Eb2"],
  ["3:0", "Db2"], ["3:2", "Bb1"]
];
const bossDrums: Array<[string, string]> = [
  ["0:0", "x"], ["0:2", "x"],
  ["1:0", "x"], ["1:2", "x"],
  ["2:0", "x"], ["2:2", "x"],
  ["3:0", "x"], ["3:2", "x"]
];

// --- lastboss (BPM 60, solemn/apocalyptic) ---
const lastbossMelody: Array<[string, string]> = [
  ["0:0", "Eb4"], ["1:0", "Gb4"], ["2:0", "Bb4"], ["3:0", "Db4"]
];
const lastbossBassLine: Array<[string, string]> = [
  ["0:0", "Eb1"], ["1:0", "Bb1"], ["2:0", "Ab1"], ["3:0", "Db2"]
];

// ============================================================
// BGM play functions
// ============================================================

const playHomeBGM = (): void => {
  const reverb = new Tone.Freeverb(0.7, 3000).toDestination();
  reverb.wet.value = 0.25;
  const filter = new Tone.Filter({ frequency: 1800, type: "lowpass", rolloff: -12 }).connect(reverb);

  const melodySynth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "triangle" },
    envelope: { attack: 0.04, decay: 0.3, sustain: 0.4, release: 0.6 }
  }).connect(filter);
  melodySynth.volume.value = -20;

  const bassSynth = new Tone.Synth({
    oscillator: { type: "sine" },
    envelope: { attack: 0.06, decay: 0.4, sustain: 0.6, release: 0.8 }
  }).connect(filter);
  bassSynth.volume.value = -22;

  const melodyPart = new Tone.Part((time, note: string) => {
    melodySynth.triggerAttackRelease(note, "2n", time);
  }, homeMelody.map(([t, n]) => [t, n]));

  const bassPart = new Tone.Part((time, note: string) => {
    bassSynth.triggerAttackRelease(note, "2n", time);
  }, homeBassLine.map(([t, n]) => [t, n]));

  melodyPart.loop = true; melodyPart.loopEnd = "4m";
  bassPart.loop = true;   bassPart.loopEnd = "4m";

  Tone.getTransport().bpm.value = 74;
  melodyPart.start(0);
  bassPart.start(0);
  Tone.getTransport().start();

  bgmHandles = { parts: [melodyPart, bassPart], synths: [melodySynth, bassSynth], effects: [filter, reverb] };
};

const playVillageBGM = (): void => {
  const reverb = new Tone.Freeverb(0.6, 2500).toDestination();
  reverb.wet.value = 0.2;
  const filter = new Tone.Filter({ frequency: 2200, type: "lowpass", rolloff: -12 }).connect(reverb);

  const melodySynth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "triangle" },
    envelope: { attack: 0.03, decay: 0.2, sustain: 0.5, release: 0.5 }
  }).connect(filter);
  melodySynth.volume.value = -18;

  const bassSynth = new Tone.Synth({
    oscillator: { type: "sine" },
    envelope: { attack: 0.05, decay: 0.3, sustain: 0.6, release: 0.7 }
  }).connect(filter);
  bassSynth.volume.value = -20;

  const melodyPart = new Tone.Part((time, note: string) => {
    melodySynth.triggerAttackRelease(note, "4n", time);
  }, villageMelody.map(([t, n]) => [t, n]));

  const bassPart = new Tone.Part((time, note: string) => {
    bassSynth.triggerAttackRelease(note, "2n", time);
  }, villageBassLine.map(([t, n]) => [t, n]));

  melodyPart.loop = true; melodyPart.loopEnd = "4m";
  bassPart.loop = true;   bassPart.loopEnd = "4m";

  Tone.getTransport().bpm.value = 110;
  melodyPart.start(0);
  bassPart.start(0);
  Tone.getTransport().start();

  bgmHandles = { parts: [melodyPart, bassPart], synths: [melodySynth, bassSynth], effects: [filter, reverb] };
};

const playFieldBGM = (): void => {
  const reverb = new Tone.Freeverb(0.5, 2000).toDestination();
  reverb.wet.value = 0.18;
  const filter = new Tone.Filter({ frequency: 2500, type: "lowpass", rolloff: -12 }).connect(reverb);

  const melodySynth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "sawtooth" },
    envelope: { attack: 0.01, decay: 0.12, sustain: 0.3, release: 0.3 }
  }).connect(filter);
  melodySynth.volume.value = -20;

  const bassSynth = new Tone.Synth({
    oscillator: { type: "sine" },
    envelope: { attack: 0.03, decay: 0.25, sustain: 0.5, release: 0.5 }
  }).connect(filter);
  bassSynth.volume.value = -18;

  const melodyPart = new Tone.Part((time, note: string) => {
    melodySynth.triggerAttackRelease(note, "8n", time);
  }, fieldMelody.map(([t, n]) => [t, n]));

  const bassPart = new Tone.Part((time, note: string) => {
    bassSynth.triggerAttackRelease(note, "4n", time);
  }, fieldBassLine.map(([t, n]) => [t, n]));

  melodyPart.loop = true; melodyPart.loopEnd = "4m";
  bassPart.loop = true;   bassPart.loopEnd = "4m";

  Tone.getTransport().bpm.value = 100;
  melodyPart.start(0);
  bassPart.start(0);
  Tone.getTransport().start();

  bgmHandles = { parts: [melodyPart, bassPart], synths: [melodySynth, bassSynth], effects: [filter, reverb] };
};

const playDungeonBGM = (): void => {
  const reverb = new Tone.Freeverb(0.85, 5000).toDestination();
  reverb.wet.value = 0.35;
  const filter = new Tone.Filter({ frequency: 900, type: "lowpass", rolloff: -24 }).connect(reverb);

  const melodySynth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "square" },
    envelope: { attack: 0.1, decay: 0.5, sustain: 0.4, release: 1.0 }
  }).connect(filter);
  melodySynth.volume.value = -22;

  const bassSynth = new Tone.Synth({
    oscillator: { type: "sine" },
    envelope: { attack: 0.1, decay: 0.6, sustain: 0.7, release: 1.2 }
  }).connect(filter);
  bassSynth.volume.value = -18;

  const melodyPart = new Tone.Part((time, note: string) => {
    melodySynth.triggerAttackRelease(note, "2n", time);
  }, dungeonMelody.map(([t, n]) => [t, n]));

  const bassPart = new Tone.Part((time, note: string) => {
    bassSynth.triggerAttackRelease(note, "2n.", time);
  }, dungeonBassLine.map(([t, n]) => [t, n]));

  melodyPart.loop = true; melodyPart.loopEnd = "4m";
  bassPart.loop = true;   bassPart.loopEnd = "4m";

  Tone.getTransport().bpm.value = 75;
  melodyPart.start(0);
  bassPart.start(0);
  Tone.getTransport().start();

  bgmHandles = { parts: [melodyPart, bassPart], synths: [melodySynth, bassSynth], effects: [filter, reverb] };
};

const playBattleBGM = (): void => {
  const reverb = new Tone.Freeverb(0.4, 5000).toDestination();
  reverb.wet.value = 0.18;
  const filter = new Tone.Filter({ frequency: 3500, type: "lowpass", rolloff: -12 }).connect(reverb);

  const melodySynth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "square" },
    envelope: { attack: 0.005, decay: 0.15, sustain: 0.25, release: 0.15 }
  }).connect(filter);
  melodySynth.volume.value = -16;

  const bassSynth = new Tone.Synth({
    oscillator: { type: "triangle" },
    envelope: { attack: 0.005, decay: 0.18, sustain: 0.4, release: 0.2 }
  }).connect(filter);
  bassSynth.volume.value = -14;

  const drumSynth = new Tone.MembraneSynth({
    pitchDecay: 0.04,
    octaves: 5,
    envelope: { attack: 0.001, decay: 0.18, sustain: 0, release: 0.05 }
  }).toDestination();
  drumSynth.volume.value = -18;

  const melodyPart = new Tone.Part((time, note: string) => {
    melodySynth.triggerAttackRelease(note, "8n", time);
  }, battleMelody.map(([t, n]) => [t, n]));

  const bassPart = new Tone.Part((time, note: string) => {
    bassSynth.triggerAttackRelease(note, "4n", time);
  }, battleBassLine.map(([t, n]) => [t, n]));

  const drumPart = new Tone.Part((time) => {
    drumSynth.triggerAttackRelease("C2", "16n", time);
  }, battleDrums.map(([t]) => [t, "x"]));

  [melodyPart, bassPart, drumPart].forEach((p) => {
    p.loop = true;
    p.loopEnd = "4m";
  });

  Tone.getTransport().bpm.value = 140;
  melodyPart.start(0);
  bassPart.start(0);
  drumPart.start(0);
  Tone.getTransport().start();

  bgmHandles = { parts: [melodyPart, bassPart, drumPart], synths: [melodySynth, bassSynth, drumSynth], effects: [filter, reverb] };
};

const playBossBGM = (): void => {
  const reverb = new Tone.Freeverb(0.7, 4000).toDestination();
  reverb.wet.value = 0.28;
  const filter = new Tone.Filter({ frequency: 2000, type: "lowpass", rolloff: -12 }).connect(reverb);

  const melodySynth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "sawtooth" },
    envelope: { attack: 0.02, decay: 0.2, sustain: 0.4, release: 0.4 }
  }).connect(filter);
  melodySynth.volume.value = -16;

  const bassSynth = new Tone.Synth({
    oscillator: { type: "triangle" },
    envelope: { attack: 0.05, decay: 0.35, sustain: 0.6, release: 0.8 }
  }).connect(filter);
  bassSynth.volume.value = -14;

  const drumSynth = new Tone.MembraneSynth({
    pitchDecay: 0.06,
    octaves: 5,
    envelope: { attack: 0.001, decay: 0.25, sustain: 0, release: 0.1 }
  }).toDestination();
  drumSynth.volume.value = -16;

  const melodyPart = new Tone.Part((time, note: string) => {
    melodySynth.triggerAttackRelease(note, "8n", time);
  }, bossMelody.map(([t, n]) => [t, n]));

  const bassPart = new Tone.Part((time, note: string) => {
    bassSynth.triggerAttackRelease(note, "4n", time);
  }, bossBassLine.map(([t, n]) => [t, n]));

  const drumPart = new Tone.Part((time) => {
    drumSynth.triggerAttackRelease("C2", "16n", time);
  }, bossDrums.map(([t]) => [t, "x"]));

  [melodyPart, bassPart, drumPart].forEach((p) => {
    p.loop = true;
    p.loopEnd = "4m";
  });

  Tone.getTransport().bpm.value = 80;
  melodyPart.start(0);
  bassPart.start(0);
  drumPart.start(0);
  Tone.getTransport().start();

  bgmHandles = { parts: [melodyPart, bassPart, drumPart], synths: [melodySynth, bassSynth, drumSynth], effects: [filter, reverb] };
};

const playLastbossBGM = (): void => {
  const reverb = new Tone.Freeverb(0.95, 8000).toDestination();
  reverb.wet.value = 0.5;
  const filter = new Tone.Filter({ frequency: 1200, type: "lowpass", rolloff: -24 }).connect(reverb);

  const melodySynth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "sine" },
    envelope: { attack: 0.3, decay: 0.8, sustain: 0.6, release: 2.0 }
  }).connect(filter);
  melodySynth.volume.value = -18;

  const bassSynth = new Tone.Synth({
    oscillator: { type: "sine" },
    envelope: { attack: 0.3, decay: 1.0, sustain: 0.8, release: 2.5 }
  }).connect(filter);
  bassSynth.volume.value = -14;

  const melodyPart = new Tone.Part((time, note: string) => {
    melodySynth.triggerAttackRelease(note, "1n", time);
  }, lastbossMelody.map(([t, n]) => [t, n]));

  const bassPart = new Tone.Part((time, note: string) => {
    bassSynth.triggerAttackRelease(note, "1n.", time);
  }, lastbossBassLine.map(([t, n]) => [t, n]));

  melodyPart.loop = true; melodyPart.loopEnd = "4m";
  bassPart.loop = true;   bassPart.loopEnd = "4m";

  Tone.getTransport().bpm.value = 60;
  melodyPart.start(0);
  bassPart.start(0);
  Tone.getTransport().start();

  bgmHandles = { parts: [melodyPart, bassPart], synths: [melodySynth, bassSynth], effects: [filter, reverb] };
};

// ============================================================
// Public API
// ============================================================

export const playBGM = (type: BGMType): void => {
  if (!unlocked) return;
  if (currentBGM === type) return;

  stopBGM();

  switch (type) {
    case "home":    playHomeBGM();     break;
    case "village": playVillageBGM();  break;
    case "field":   playFieldBGM();    break;
    case "dungeon": playDungeonBGM();  break;
    case "battle":  playBattleBGM();  break;
    case "boss":    playBossBGM();     break;
    case "lastboss":playLastbossBGM(); break;
  }
  currentBGM = type;
};

export const stopBGM = (): void => {
  bgmHandles.parts.forEach((p) => { p.stop(); p.dispose(); });
  bgmHandles.synths.forEach((s) => s.dispose());
  bgmHandles.effects.forEach((e) => e.dispose());

  Tone.getTransport().stop();
  Tone.getTransport().cancel();

  bgmHandles = { parts: [], synths: [], effects: [] };
  currentBGM = null;
};
