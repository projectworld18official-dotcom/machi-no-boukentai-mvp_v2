import type {
  HeroState,
  JobsState,
  LegacyCharsState,
  PartyState,
  SaveData
} from "../types";
import { characters } from "../data/characters";

const KEY = "machi_no_boukentai_save_v2";
const CURRENT_VERSION = 3;

const initialHero = (): HeroState => ({
  name: "",
  nameSet: false,
  level: 1,
  exp: 0,
  hp: 100,
  maxHp: 100
});

const initialJobs = (): JobsState => ({
  warrior: { level: 1, exp: 0, hp: 110, maxHp: 110, unlocked: true },
  monk: { level: 1, exp: 0, hp: 130, maxHp: 130, unlocked: true },
  mage: { level: 1, exp: 0, hp: 70, maxHp: 70, mp: 30, maxMp: 30, unlocked: true },
  youtuber: { level: 1, exp: 0, hp: 80, maxHp: 80, unlocked: true }
});

const initialParty = (): PartyState => ({
  member1: "hero",
  member2: "warrior",
  member3: "mage"
});

const initialLegacy = (ownedIds: string[], levels: Record<string, number>): LegacyCharsState => {
  const out: LegacyCharsState["levels"] = {};
  ownedIds.forEach((id) => {
    out[id] = { level: levels[id] ?? 1, exp: 0 };
  });
  return { ownedIds, levels: out };
};

const initial = (): SaveData => {
  const allIds = characters.map((c) => c.id);
  const baseLevels = Object.fromEntries(allIds.map((id) => [id, 1]));

  return {
    version: CURRENT_VERSION,
    ownedIds: allIds,
    selectedId: "mio",
    levels: baseLevels,
    gems: 500,
    battleStage: 1,
    gachaHistory: [],
    hero: initialHero(),
    jobs: initialJobs(),
    party: initialParty(),
    legacyChars: initialLegacy(allIds, baseLevels)
  };
};

const migrate = (raw: unknown): SaveData => {
  if (!raw || typeof raw !== "object") return initial();

  const r = raw as Partial<SaveData> & Record<string, unknown>;
  const version = typeof r.version === "number" ? r.version : 1;

  // 既存 v2 互換フィールドを抽出 (v1/v2/v3 共通)
  const ownedIds = Array.isArray(r.ownedIds) ? (r.ownedIds as string[]) : ["mio"];
  const oldLevels: Record<string, number> = { ...((r.levels as Record<string, number>) ?? {}) };
  ownedIds.forEach((id) => {
    if (typeof oldLevels[id] !== "number") oldLevels[id] = 1;
  });
  const selectedId =
    typeof r.selectedId === "string" && ownedIds.includes(r.selectedId)
      ? r.selectedId
      : ownedIds[0] ?? "mio";
  const gems = typeof r.gems === "number" ? r.gems : 500;
  const battleStage = typeof r.battleStage === "number" ? r.battleStage : 1;
  const gachaHistory = Array.isArray(r.gachaHistory) ? (r.gachaHistory as string[]) : [];

  if (version >= CURRENT_VERSION) {
    // v3 既存。defensive 補完して返す。
    const fallback = initial();
    return {
      version: CURRENT_VERSION,
      ownedIds,
      selectedId,
      levels: oldLevels,
      gems,
      battleStage,
      gachaHistory,
      hero: { ...fallback.hero, ...((r.hero as HeroState) ?? {}) },
      jobs: { ...fallback.jobs, ...((r.jobs as JobsState) ?? {}) },
      party: { ...fallback.party, ...((r.party as PartyState) ?? {}) },
      legacyChars: { ...fallback.legacyChars, ...((r.legacyChars as LegacyCharsState) ?? {}) }
    };
  }

  // v1/v2 → v3:
  // - 既存 ownedIds/levels を legacyChars へ移管
  // - hero/jobs/party は新規初期化
  // - gems / battleStage / gachaHistory は完全保持
  const allIds = characters.map((c) => c.id);
  const baseLevels = Object.fromEntries(allIds.map((id) => [id, 1]));

  return {
    version: CURRENT_VERSION,
    ownedIds: allIds,
    selectedId: "mio",
    levels: baseLevels,
    gems,
    battleStage,
    gachaHistory,
    hero: initialHero(),
    jobs: initialJobs(),
    party: initialParty(),
    legacyChars: initialLegacy(ownedIds, oldLevels)
  };
};

export const loadSave = (): SaveData => {
  const raw = localStorage.getItem(KEY);

  if (!raw) return initial();

  try {
    return migrate(JSON.parse(raw));
  } catch {
    return initial();
  }
};

export const saveData = (data: SaveData): void => {
  localStorage.setItem(KEY, JSON.stringify(data));
};
