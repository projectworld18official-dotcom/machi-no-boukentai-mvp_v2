import { getCharacter } from "../data/characters";
import {
  GACHA_COST_SINGLE,
  GACHA_COST_TEN,
  rarityText,
  rollSingle,
  rollTen
} from "../data/gacha";

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
  return (
    <div className="card">
      <h2>ガチャ</h2>
      <p>💎 {gems}</p>
      <p>{rarityText()}</p>

      <button
        onClick={() => addResult([rollSingle()], GACHA_COST_SINGLE)}
        disabled={gems < GACHA_COST_SINGLE}
      >
        単発 30
      </button>

      <button
        onClick={() => addResult(rollTen(), GACHA_COST_TEN)}
        disabled={gems < GACHA_COST_TEN}
      >
        10連 300
      </button>

      <div className="resultBox">
        {latest.map((id, i) => {
          const c = getCharacter(id);

          return (
            <div
              key={`${id}-${i}`}
              className={`capsule rarity${c.rarity}`}
              style={{ background: c.color }}
            >
              <div className="big">{c.emoji}</div>
              <div>{c.name}</div>
              <div>★{c.rarity}</div>
            </div>
          );
        })}
      </div>

      <button onClick={back}>もどる</button>
    </div>
  );
}
