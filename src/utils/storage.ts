import type { SaveData } from "../types";
import { characters } from "../data/characters";

const KEY = "machi_no_boukentai_save_v2";
const CURRENT_VERSION = 2;

const initial = (): SaveData => ({
  version: CURRENT_VERSION,
  ownedIds: characters.map((c) => c.id),
  selectedId: "mio",
  levels: Object.fromEntries(characters.map((c) => [c.id, 1])),
  gems: 500,
  battleStage: 1,
  gachaHistory: []
});

const migrate = (raw: unknown): SaveData => {
  if (!raw || typeof raw !== "object") return initial();

  const r = raw as Partial<SaveData> & Record<string, unknown>;
  const version = typeof r.version === "number" ? r.version : 1;

  if (version >= CURRENT_VERSION) {
    const ownedIds = Array.isArray(r.ownedIds) ? (r.ownedIds as string[]) : ["mio"];
    const levels: Record<string, number> = { ...((r.levels as Record<string, number>) ?? {}) };
    ownedIds.forEach((id) => {
      if (typeof levels[id] !== "number") levels[id] = 1;
    });
    const selectedId =
      typeof r.selectedId === "string" && ownedIds.includes(r.selectedId)
        ? r.selectedId
        : ownedIds[0] ?? "mio";

    return {
      version: CURRENT_VERSION,
      ownedIds,
      selectedId,
      levels,
      gems: typeof r.gems === "number" ? r.gems : 500,
      battleStage: typeof r.battleStage === "number" ? r.battleStage : 1,
      gachaHistory: Array.isArray(r.gachaHistory) ? (r.gachaHistory as string[]) : []
    };
  }

  // v1 → v2: 全キャラを所持済みに昇格、levels/selectedId 補完。gems/battleStage/gachaHistory は完全保持。
  const ownedIds = characters.map((c) => c.id);
  const levels = Object.fromEntries(ownedIds.map((id) => [id, 1]));

  return {
    version: CURRENT_VERSION,
    ownedIds,
    selectedId: "mio",
    levels,
    gems: typeof r.gems === "number" ? r.gems : 500,
    battleStage: typeof r.battleStage === "number" ? r.battleStage : 1,
    gachaHistory: Array.isArray(r.gachaHistory) ? (r.gachaHistory as string[]) : []
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
