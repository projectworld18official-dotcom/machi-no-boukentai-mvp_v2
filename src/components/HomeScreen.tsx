import { useEffect } from "react";
import { getCharacter } from "../data/characters";
import { playBGM, playSE, stopBGM, unlockAudio } from "../utils/audio";

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
  // 初回マウントは Tone unlock 前なので no-op、戦闘から戻った時に発火する想定。
  // 初回タップ後の home 滞在は go/pick 内で playBGM を再試行するためカバー。
  useEffect(() => {
    playBGM("home");

    return () => {
      stopBGM();
    };
  }, []);

  const go = async (screen: string): Promise<void> => {
    await unlockAudio();

    playSE("decision");
    onMove(screen);
  };

  const pick = async (id: string): Promise<void> => {
    await unlockAudio();
    // 初回タップ後は unlocked=true なので BGM 起動を再試行 (audio.ts 内 currentBGM ガードで重複起動なし)
    playBGM("home");

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
