import { playSE, unlockAudio } from "../utils/audio";

interface Props {
  onMove: (screen: string) => void;
}

export default function HomeScreen({ onMove }: Props) {
  const go = async (screen: string): Promise<void> => {
    await unlockAudio();

    playSE("decision");
    onMove(screen);
  };

  return (
    <div className="card screen">
      <h1>まちの冒険隊</h1>
      <p>まちをまもる仲間を集めよう！</p>

      <button onClick={() => go("battle")}>⚔️ バトル</button>
      <button onClick={() => go("gacha")}>🎁 ガチャ</button>
      <button onClick={() => go("collection")}>📚 なかま</button>
    </div>
  );
}
