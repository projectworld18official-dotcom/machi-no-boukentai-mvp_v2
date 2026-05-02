import type { SaveData } from "../types";

const KEY = "machi_no_boukentai_save_v2";

const initial = (): SaveData => ({
  ownedIds: ["mio"],
  gems: 500,
  battleStage: 1,
  gachaHistory: []
});

export const loadSave = (): SaveData => {
  const raw = localStorage.getItem(KEY);

  if (!raw) return initial();

  try {
    return JSON.parse(raw) as SaveData;
  } catch {
    return initial();
  }
};

export const saveData = (data: SaveData): void => {
  localStorage.setItem(KEY, JSON.stringify(data));
};
