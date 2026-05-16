import { MAPS } from "../data/mapData";

interface Props {
  clearedMapIds: string[];
  onSelect: (mapId: string) => void;
  onBack: () => void;
}

export default function AreaSelectScreen({ clearedMapIds, onSelect, onBack }: Props) {
  return (
    <div className="card screen">
      <h2>🗺 エリアをえらぼう</h2>
      <p style={{ fontSize: "13px", color: "#555", margin: "4px 0 12px" }}>
        ぼうけんしたいエリアをタップしてね
      </p>

      {MAPS.map((map) => {
        const cleared = clearedMapIds.includes(map.id);
        return (
          <button
            key={map.id}
            onClick={() => onSelect(map.id)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              padding: "14px 16px",
              marginTop: "10px",
              background: cleared ? "#e8f5e8" : "#f0f6ff",
              border: `2px solid ${cleared ? "#4fd47f" : "#c0d4f5"}`,
              borderRadius: "14px",
              color: "#222",
              textAlign: "left",
              position: "relative",
            }}
          >
            {cleared && (
              <span style={{
                position: "absolute",
                top: "10px",
                right: "12px",
                background: "#4fd47f",
                color: "#fff",
                fontSize: "11px",
                fontWeight: "bold",
                padding: "2px 8px",
                borderRadius: "10px",
              }}>
                ✅ クリア
              </span>
            )}
            <span style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "4px" }}>
              {map.name}
            </span>
            <span style={{ fontSize: "13px", color: "#555" }}>
              {map.description}
            </span>
            <span style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>
              てき {map.enemies.length}体
            </span>
          </button>
        );
      })}

      <button
        onClick={onBack}
        style={{ marginTop: "16px", background: "#888" }}
      >
        もどる
      </button>
    </div>
  );
}
