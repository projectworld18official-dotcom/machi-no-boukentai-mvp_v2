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

    ids.forEach((id) => owned.add(id));

    setData({
      ...data,
      gems: data.gems - cost,
      ownedIds: [...owned],
      gachaHistory: [...ids, ...data.gachaHistory].slice(0, 30)
    });

    setLatest(ids);
  };

  const win = (): void => {
    setData({
      ...data,
      gems: data.gems + 50,
      battleStage: data.battleStage + 1
    });
  };

  return (
    <div className="app">
      {screen === "home" && <HomeScreen onMove={(s) => setScreen(s as Screen)} />}

      {screen === "battle" && (
        <BattleScreen
          key={data.battleStage}
          ownedIds={data.ownedIds}
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
