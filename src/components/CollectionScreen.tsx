import { characters } from "../data/characters";

interface Props {
  ownedIds: string[];
  back: () => void;
}

export default function CollectionScreen({ ownedIds, back }: Props) {
  return (
    <div className="card">
      <h2>なかま図鑑</h2>

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

      <button onClick={back}>もどる</button>
    </div>
  );
}
