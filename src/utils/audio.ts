import * as Tone from "tone";

export type SEType =
  | "attack"
  | "damage"
  | "decision"
  | "cancel"
  | "gacha"
  | "levelup"
  | "victory";

export type BGMType = "home" | "battle";

let unlocked = false;
let currentBGM: BGMType | null = null;

interface BgmHandles {
  parts: Tone.Part[];
  synths: Array<Tone.PolySynth | Tone.Synth>;
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
      setTimeout(() => synth.dispose(), 1200);

      break;
    }

    case "victory": {
      // ステージクリア用ファンファーレ。既存 6SE と整合する Triangle 系合成音。
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

// 哀愁系 BGM: Eb minor pentatonic = Eb / Gb / Ab / Bb / Db (ピアノ黒鍵 5 音相当)
// ベースライン仕様: Eb - B - Db 反復 (司令官指示準拠、Tone.js では Eb 表記で安全側統一)

const homeMelody: Array<[string, string]> = [
  ["0:0", "Eb5"],
  ["0:2", "Gb5"],
  ["1:0", "Bb4"],
  ["1:2", "Ab4"],
  ["2:0", "Db5"],
  ["2:2", "Eb5"],
  ["3:0", "Bb4"],
  ["3:2", "Eb4"]
];

const homeBassLine: Array<[string, string]> = [
  ["0:0", "Eb3"],
  ["1:0", "B2"],
  ["2:0", "Db3"],
  ["3:0", "Eb3"]
];

// === Phase 2c-1 戦闘 BGM ===
// D minor、テンポ速め定番系。8 分音符主体で疾走感、ベース 4 つ打ち
const battleMelody: Array<[string, string]> = [
  ["0:0", "D5"],  ["0:1", "F5"],  ["0:1.5", "A5"], ["0:2", "G5"],  ["0:2.5", "F5"], ["0:3", "D5"],  ["0:3.5", "E5"],
  ["1:0", "F5"],  ["1:1", "A5"],  ["1:1.5", "D6"], ["1:2", "C6"],  ["1:2.5", "A5"], ["1:3", "G5"],  ["1:3.5", "F5"],
  ["2:0", "E5"],  ["2:0.5", "D5"],["2:1", "C5"],   ["2:1.5", "D5"],["2:2", "F5"],   ["2:2.5", "G5"],["2:3", "A5"],   ["2:3.5", "G5"],
  ["3:0", "F5"],  ["3:1", "E5"],  ["3:1.5", "D5"], ["3:2", "C#5"], ["3:2.5", "D5"], ["3:3", "A4"]
];

// 4つ打ちベース (D minor 進行: Dm - Bb - F - A)
const battleBassLine: Array<[string, string]> = [
  ["0:0", "D2"],  ["0:1", "D2"],  ["0:2", "D2"],  ["0:3", "D2"],
  ["1:0", "Bb1"], ["1:1", "Bb1"], ["1:2", "Bb1"], ["1:3", "Bb1"],
  ["2:0", "F2"],  ["2:1", "F2"],  ["2:2", "F2"],  ["2:3", "F2"],
  ["3:0", "A1"],  ["3:1", "A1"],  ["3:2", "A1"],  ["3:3", "A1"]
];

// パーカッション風 (ノイズ kick on beat)
const battleDrums: Array<[string, string]> = [
  ["0:0", "x"], ["0:1", "x"], ["0:2", "x"], ["0:3", "x"],
  ["1:0", "x"], ["1:1", "x"], ["1:2", "x"], ["1:3", "x"],
  ["2:0", "x"], ["2:1", "x"], ["2:2", "x"], ["2:3", "x"],
  ["3:0", "x"], ["3:1", "x"], ["3:2", "x"], ["3:3", "x"]
];

const playHomeBGM = (): void => {
  // 哀愁系: Eb minor pentatonic、長音中心
  const reverb = new Tone.Freeverb(0.7, 3000).toDestination();
  reverb.wet.value = 0.25;

  const filter = new Tone.Filter({
    frequency: 1800,
    type: "lowpass",
    rolloff: -12
  }).connect(reverb);

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

  melodyPart.loop = true;
  melodyPart.loopEnd = "4m";
  bassPart.loop = true;
  bassPart.loopEnd = "4m";

  Tone.getTransport().bpm.value = 74;
  melodyPart.start(0);
  bassPart.start(0);
  Tone.getTransport().start();

  bgmHandles = {
    parts: [melodyPart, bassPart],
    synths: [melodySynth, bassSynth],
    effects: [filter, reverb]
  };
};

const playBattleBGM = (): void => {
  // 戦闘: D minor、テンポ速め定番系、メロディ Square + ベース Triangle + ノイズパーカッション
  const reverb = new Tone.Freeverb(0.4, 5000).toDestination();
  reverb.wet.value = 0.18;

  const filter = new Tone.Filter({
    frequency: 3500,
    type: "lowpass",
    rolloff: -12
  }).connect(reverb);

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

  // BPM 140 (テンポ速め)
  Tone.getTransport().bpm.value = 140;
  melodyPart.start(0);
  bassPart.start(0);
  drumPart.start(0);
  Tone.getTransport().start();

  bgmHandles = {
    parts: [melodyPart, bassPart, drumPart],
    synths: [melodySynth, bassSynth, drumSynth],
    effects: [filter, reverb]
  };
};

export const playBGM = (type: BGMType): void => {
  if (!unlocked) return;
  if (currentBGM === type) return;

  stopBGM();

  if (type === "home") {
    playHomeBGM();
  } else {
    playBattleBGM();
  }
  currentBGM = type;
};

export const stopBGM = (): void => {
  bgmHandles.parts.forEach((p) => {
    p.stop();
    p.dispose();
  });
  bgmHandles.synths.forEach((s) => s.dispose());
  bgmHandles.effects.forEach((e) => e.dispose());

  Tone.getTransport().stop();
  Tone.getTransport().cancel();

  bgmHandles = { parts: [], synths: [], effects: [] };
  currentBGM = null;
};
