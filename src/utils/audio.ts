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

const battleMelody: Array<[string, string]> = [
  ["0:0", "Eb4"], ["0:1", "Gb4"], ["0:2", "Bb4"], ["0:3", "Ab4"],
  ["1:0", "Eb5"], ["1:1", "Db5"], ["1:2", "Bb4"], ["1:3", "Gb4"],
  ["2:0", "Eb4"], ["2:1", "Bb4"], ["2:2", "Db5"], ["2:3", "Eb5"],
  ["3:0", "Bb4"], ["3:1", "Ab4"], ["3:2", "Gb4"], ["3:3", "Eb4"]
];

const battleBassLine: Array<[string, string]> = [
  ["0:0", "Eb2"], ["0:2", "Eb2"],
  ["1:0", "B1"],  ["1:2", "B1"],
  ["2:0", "Db2"], ["2:2", "Db2"],
  ["3:0", "Eb2"], ["3:2", "Bb2"]
];

export const playBGM = (type: BGMType): void => {
  if (!unlocked) return;
  if (currentBGM === type) return;

  stopBGM();

  // エフェクトチェーン: メロディ/ベース → Lowpass フィルター → Freeverb (薄め) → Destination
  const reverb = new Tone.Freeverb(0.7, 3000).toDestination();
  reverb.wet.value = 0.25;

  const filter = new Tone.Filter({
    frequency: type === "home" ? 1800 : 2300,
    type: "lowpass",
    rolloff: -12
  }).connect(reverb);

  const melodySynth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "triangle" },
    envelope: { attack: 0.04, decay: 0.3, sustain: 0.4, release: 0.6 }
  }).connect(filter);
  melodySynth.volume.value = type === "home" ? -20 : -17;

  const bassSynth = new Tone.Synth({
    oscillator: { type: "sine" },
    envelope: { attack: 0.06, decay: 0.4, sustain: 0.6, release: 0.8 }
  }).connect(filter);
  bassSynth.volume.value = type === "home" ? -22 : -19;

  const melody = type === "home" ? homeMelody : battleMelody;
  const bass = type === "home" ? homeBassLine : battleBassLine;
  const noteLen = type === "home" ? "2n" : "8n";

  const melodyPart = new Tone.Part((time, note: string) => {
    melodySynth.triggerAttackRelease(note, noteLen, time);
  }, melody.map(([t, n]) => [t, n]));

  const bassPart = new Tone.Part((time, note: string) => {
    bassSynth.triggerAttackRelease(note, "2n", time);
  }, bass.map(([t, n]) => [t, n]));

  melodyPart.loop = true;
  melodyPart.loopEnd = "4m";
  bassPart.loop = true;
  bassPart.loopEnd = "4m";

  // BPM: home=74 (穏やかな哀愁、長音中心) / battle=86 (やや動きある哀愁)
  Tone.getTransport().bpm.value = type === "home" ? 74 : 86;
  melodyPart.start(0);
  bassPart.start(0);
  Tone.getTransport().start();

  bgmHandles = {
    parts: [melodyPart, bassPart],
    synths: [melodySynth, bassSynth],
    effects: [filter, reverb]
  };
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
