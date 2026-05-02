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
let bgmHandles: { part: Tone.Part | null; synth: Tone.PolySynth | null } = {
  part: null,
  synth: null
};

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

const homeMelody: Array<[string, string]> = [
  ["0:0", "C5"],
  ["0:1", "E5"],
  ["0:2", "G5"],
  ["0:3", "E5"],
  ["1:0", "F5"],
  ["1:1", "A5"],
  ["1:2", "G5"],
  ["1:3", "E5"],
  ["2:0", "D5"],
  ["2:1", "F5"],
  ["2:2", "A5"],
  ["2:3", "F5"],
  ["3:0", "C5"],
  ["3:1", "E5"],
  ["3:2", "G5"],
  ["3:3", "C5"]
];

const battleMelody: Array<[string, string]> = [
  ["0:0", "A3"],
  ["0:1", "A3"],
  ["0:2", "C4"],
  ["0:3", "E4"],
  ["1:0", "G3"],
  ["1:1", "G3"],
  ["1:2", "B3"],
  ["1:3", "D4"],
  ["2:0", "F3"],
  ["2:1", "F3"],
  ["2:2", "A3"],
  ["2:3", "C4"],
  ["3:0", "E3"],
  ["3:1", "G3"],
  ["3:2", "A3"],
  ["3:3", "B3"]
];

export const playBGM = (type: BGMType): void => {
  if (!unlocked) return;
  if (currentBGM === type) return;

  stopBGM();

  const synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: type === "home" ? "triangle" : "sawtooth" },
    envelope: { attack: 0.02, decay: 0.2, sustain: 0.3, release: 0.2 }
  }).toDestination();

  synth.volume.value = type === "home" ? -18 : -16;

  const score = type === "home" ? homeMelody : battleMelody;

  const part = new Tone.Part((time, note: string) => {
    synth.triggerAttackRelease(note, "8n", time);
  }, score.map(([t, n]) => [t, n]));

  part.loop = true;
  part.loopEnd = "4m";

  Tone.getTransport().bpm.value = type === "home" ? 110 : 144;
  part.start(0);
  Tone.getTransport().start();

  bgmHandles = { part, synth };
  currentBGM = type;
};

export const stopBGM = (): void => {
  if (bgmHandles.part) {
    bgmHandles.part.stop();
    bgmHandles.part.dispose();
  }

  if (bgmHandles.synth) {
    bgmHandles.synth.dispose();
  }

  Tone.getTransport().stop();
  Tone.getTransport().cancel();

  bgmHandles = { part: null, synth: null };
  currentBGM = null;
};
