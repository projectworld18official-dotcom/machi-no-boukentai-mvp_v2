import { getCharacter } from "../data/characters";
import { playSE, unlockAudio } from "../utils/audio";

interface Props {
  onMove: (screen: string) => void;
  ownedIds: string[];
  selectedId: string;
  levels: Record<string, number>;
  onSelect: (id: string) => void;
}

export default function HomeScreen({
  onMove,
  ownedIds,
  selectedId,
  levels,
  onSelect
}: Props) {
  const go = async (screen: string): Promise<void> => {
    await unlockAudio();

    playSE("decision");
    onMove(screen);
  };

  const pick = async (id: string): Promise<void> => {
    await unlockAudio();

    playSE("decision");
    onSelect(id);
  };

  const selected = getCharacter(selectedId);

  return (
    <div className="card screen">
      <h1>まちの冒険隊</h1>
      <p>まちをまもる仲間を集めよう！</p>

      <p className="charSelectLabel">
        なかまをえらぶ <span className="lvInline">{selected.name} Lv.{levels[selectedId] ?? 1}</span>
      </p>

      <div className="charSelectRow">
        {ownedIds.map((id) => {
          const c = getCharacter(id);
          const lv = levels[id] ?? 1;
          const active = id === selectedId;

          return (
            <button
              key={id}
              type="button"
              className={`charCard ${active ? "charCard--active" : ""}`}
              style={{ background: c.color }}
              onClick={() => pick(id)}
            >
              <span className="lvBadge">Lv.{lv}</span>
              <div className="charCardEmoji">{c.emoji}</div>
              <div className="charCardName">{c.name}</div>
            </button>
          );
        })}
      </div>

      <button onClick={() => go("battle")}>⚔️ バトル</button>
      <button onClick={() => go("gacha")}>🎁 ガチャ</button>
      <button onClick={() => go("collection")}>📚 なかま</button>
    </div>
  );
}
