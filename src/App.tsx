import { useState } from "react";
import BattleScreen from "./components/BattleScreen";
import CollectionScreen from "./components/CollectionScreen";
import GachaScreen from "./components/GachaScreen";
import HomeScreen from "./components/HomeScreen";
import { useGameState } from "./hooks/useGameState";

type Screen = "home" | "battle" | "gacha" | "collection";

export default function App() {
  const { data, setData } = useGameState();
  const [screen, setScreen] = useState<Screen>("home");
  const [latest, setLatest] = useState<string[]>([]);

  const addResult = (ids: string[], cost: number): void => {
    if (data.gems < cost) return;

    const owned = new Set(data.ownedIds);
    const levels = { ...data.levels };

    ids.forEach((id) => {
      owned.add(id);
      if (typeof levels[id] !== "number") levels[id] = 1;
    });

    setData({
      ...data,
      gems: data.gems - cost,
      ownedIds: [...owned],
      levels,
      gachaHistory: [...ids, ...data.gachaHistory].slice(0, 30)
    });

    setLatest(ids);
  };

  const win = (): void => {
    setData({
      ...data,
      gems: data.gems + 50,
      battleStage: data.battleStage + 1,
      levels: {
        ...data.levels,
        [data.selectedId]: (data.levels[data.selectedId] ?? 1) + 1
      }
    });
  };

  const selectCharacter = (id: string): void => {
    if (!data.ownedIds.includes(id)) return;
    setData({ ...data, selectedId: id });
  };

  return (
    <div className="app">
      {screen === "home" && (
        <HomeScreen
          onMove={(s) => setScreen(s as Screen)}
          ownedIds={data.ownedIds}
          selectedId={data.selectedId}
          levels={data.levels}
          onSelect={selectCharacter}
        />
      )}

      {screen === "battle" && (
        <BattleScreen
          key={data.battleStage}
          selectedId={data.selectedId}
          level={data.levels[data.selectedId] ?? 1}
          stage={data.battleStage}
          win={win}
          back={() => setScreen("home")}
        />
      )}

      {screen === "gacha" && (
        <GachaScreen
          gems={data.gems}
          addResult={addResult}
          latest={latest}
          back={() => setScreen("home")}
        />
      )}

      {screen === "collection" && (
        <CollectionScreen
          ownedIds={data.ownedIds}
          back={() => setScreen("home")}
        />
      )}
    </div>
  );
}
