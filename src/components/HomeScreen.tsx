interface Props {
  onMove: (screen: string) => void;
}

export default function HomeScreen({ onMove }: Props) {
  return (
    <div className="card">
      <h1>まちの冒険隊</h1>
      <p>まちをまもる仲間を集めよう！</p>

      <button onClick={() => onMove("battle")}>⚔️ バトル</button>
      <button onClick={() => onMove("gacha")}>🎁 ガチャ</button>
      <button onClick={() => onMove("collection")}>📚 なかま</button>
    </div>
  );
}
