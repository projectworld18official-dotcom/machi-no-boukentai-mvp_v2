import type {
  EquippedSkins,
  HeroState,
  JobsState,
  LegacyCharsState,
  PartyMemberId,
  PartyState,
  RewardsState,
  SaveData,
  SkinsState
} from "../types";
import { characters } from "../data/characters";

const KEY = "machi_no_boukentai_save_v2";
const CURRENT_VERSION = 4;

const PARTY_IDS: PartyMemberId[] = ["hero", "warrior", "monk", "mage", "youtuber"];

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

// 各キャラのデフォルトスキン id (Phase 2d)。skins.ts と整合。
const defaultBodySkinId = (member: PartyMemberId): string => {
  if (member === "monk") return "monk_body_white";
  return `${member}_body_normal`;
};

const initialSkins = (): SkinsState => {
  const owned: SkinsState["owned"] = {};
  const equipped = {} as Record<PartyMemberId, EquippedSkins>;

  PARTY_IDS.forEach((m) => {
    const def = defaultBodySkinId(m);
    owned[def] = true;
    equipped[m] = { body: def, weapon: null, special: null };
  });

  return { owned, equipped };
};

const initialRewards = (): RewardsState => ({
  firstLoginClaimed: false,
  stagesCleared: {}
});

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
    legacyChars: initialLegacy(allIds, baseLevels),
    skins: initialSkins(),
    rewards: initialRewards()
  };
};

const ensureSkinsDefensive = (raw: Partial<SkinsState> | undefined): SkinsState => {
  const fallback = initialSkins();
  if (!raw) return fallback;

  const owned: SkinsState["owned"] = { ...(raw.owned ?? {}) };
  const equipped = {} as Record<PartyMemberId, EquippedSkins>;

  PARTY_IDS.forEach((m) => {
    const def = defaultBodySkinId(m);
    if (!owned[def]) owned[def] = true;
    const e = raw.equipped?.[m];
    equipped[m] = {
      body: e?.body ?? def,
      weapon: e?.weapon ?? null,
      special: e?.special ?? null
    };
  });

  return { owned, equipped };
};

const ensureRewardsDefensive = (raw: Partial<RewardsState> | undefined): RewardsState => {
  if (!raw) return initialRewards();
  return {
    firstLoginClaimed: typeof raw.firstLoginClaimed === "boolean" ? raw.firstLoginClaimed : false,
    stagesCleared: raw.stagesCleared ?? {}
  };
};

const migrate = (raw: unknown): SaveData => {
  if (!raw || typeof raw !== "object") return initial();

  const r = raw as Partial<SaveData> & Record<string, unknown>;
  const version = typeof r.version === "number" ? r.version : 1;

  // 共通フィールド抽出
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
    // v4 既存。defensive 補完
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
      legacyChars: { ...fallback.legacyChars, ...((r.legacyChars as LegacyCharsState) ?? {}) },
      skins: ensureSkinsDefensive(r.skins as Partial<SkinsState> | undefined),
      rewards: ensureRewardsDefensive(r.rewards as Partial<RewardsState> | undefined)
    };
  }

  // v1/v2/v3 → v4 共通経路
  // v1/v2 は Phase 2c-1 で v3 化したルートを通って hero/jobs/party/legacyChars が生成される。
  // ここでは入力 raw から取得できる範囲で hero/jobs/party/legacyChars を構築 (v3 既存 or 初期化フォールバック)。
  const fallback = initial();

  const hero = (r.hero as HeroState | undefined) ?? initialHero();
  const jobs = (r.jobs as JobsState | undefined) ?? initialJobs();
  const party = (r.party as PartyState | undefined) ?? initialParty();
  const legacyChars =
    (r.legacyChars as LegacyCharsState | undefined) ?? initialLegacy(ownedIds, oldLevels);

  return {
    version: CURRENT_VERSION,
    ownedIds: fallback.ownedIds,
    selectedId: "mio",
    levels: fallback.levels,
    gems,
    battleStage,
    gachaHistory,
    hero: { ...fallback.hero, ...hero },
    jobs: { ...fallback.jobs, ...jobs },
    party: { ...fallback.party, ...party },
    legacyChars,
    skins: initialSkins(),
    rewards: initialRewards()
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
