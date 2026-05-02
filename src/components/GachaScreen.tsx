import { useEffect, useState } from "react";
import { getCharacter } from "../data/characters";
import {
  GACHA_COST_SINGLE,
  GACHA_COST_TEN,
  rarityText,
  rollSingle,
  rollTen
} from "../data/gacha";
import { playBGM, playSE, stopBGM } from "../utils/audio";

interface Props {
  gems: number;
  addResult: (ids: string[], cost: number) => void;
  back: () => void;
  latest: string[];
}

export default function GachaScreen({
  gems,
  addResult,
  back,
  latest
}: Props) {
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    playBGM("home");

    return () => {
      stopBGM();
    };
  }, []);

  useEffect(() => {
    if (latest.length === 0) return;

    setShowResults(true);
    playSE("gacha");

    const timer = setTimeout(() => setShowResults(true), 50);

    return () => clearTimeout(timer);
  }, [latest]);

  const pull = (single: boolean): void => {
    if (single) {
      const cost = GACHA_COST_SINGLE;

      if (gems < cost) return;

      addResult([rollSingle()], cost);
    } else {
      const cost = GACHA_COST_TEN;

      if (gems < cost) return;

      addResult(rollTen(), cost);
    }
  };

  const handleBack = (): void => {
    playSE("cancel");
    back();
  };

  const topRarity = latest.reduce(
    (max, id) => Math.max(max, getCharacter(id).rarity),
    0
  );

  return (
    <div className="card screen">
      <h2>ガチャ</h2>
      <p>💎 {gems}</p>
      <p>{rarityText()}</p>

      <button
        onClick={() => pull(true)}
        disabled={gems < GACHA_COST_SINGLE}
      >
        単発 30
      </button>

      <button
        onClick={() => pull(false)}
        disabled={gems < GACHA_COST_TEN}
      >
        10連 300
      </button>

      <div className={`resultBox ${showResults ? "show" : ""}`}>
        {latest.map((id, i) => {
          const c = getCharacter(id);

          return (
            <div
              key={`${id}-${i}`}
              className={`capsule rarity${c.rarity} effect${c.rarity}`}
              style={{ background: c.color }}
            >
              <div className="big">{c.emoji}</div>
              <div>{c.name}</div>
              <div>★{c.rarity}</div>
            </div>
          );
        })}
      </div>

      {topRarity === 5 && latest.length > 0 && (
        <div key={`burst-${latest.join("-")}`} className="rainbowBurst" />
      )}

      <button onClick={handleBack}>もどる</button>
    </div>
  );
}
