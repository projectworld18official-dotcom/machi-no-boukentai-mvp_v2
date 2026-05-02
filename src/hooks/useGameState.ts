import { useEffect, useState } from "react";
import type { SaveData } from "../types";
import { loadSave, saveData } from "../utils/storage";

export const useGameState = () => {
  const [data, setData] = useState<SaveData>(loadSave());

  useEffect(() => {
    saveData(data);
  }, [data]);

  return { data, setData };
};
