import { characters } from "../data/characters";
import { playSE } from "../utils/audio";

interface Props {
  ownedIds: string[];
  back: () => void;
}

export default function CollectionScreen({ ownedIds, back }: Props) {
  const handleBack = (): void => {
    playSE("cancel");
    back();
  };

  return (
    <div className="card screen">
      <h2>なかま図鑑</h2>

      <div className="collectionHelp">
        <p>ガチャでなかまをふやそう！</p>
        <p>あつめたなかまは、ずかんにとうろくされるよ。</p>
        <p>★3 / ★4 / ★5 でレアリティがちがうよ。</p>
      </div>

      {characters.map((c) => {
        const owned = ownedIds.includes(c.id);

        return (
          <div key={c.id} className="row">
            <span>{owned ? c.emoji : "❓"}</span>
            <span>{owned ? c.name : "？？？"}</span>
            <span>★{owned ? c.rarity : "?"}</span>
          </div>
        );
      })}

      <button onClick={handleBack}>もどる</button>
    </div>
  );
}
