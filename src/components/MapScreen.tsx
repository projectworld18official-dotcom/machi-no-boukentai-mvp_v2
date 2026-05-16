import { useEffect, useRef, useState } from "react";
import type { MapDefinition, MapEnemySpawn } from "../data/mapData";

interface Props {
  mapId: string;
  map: MapDefinition;
  defeatedEnemyIds: string[];
  onEncounter: (enemy: MapEnemySpawn) => void;
  onAreaClear: (mapId: string) => void;
  onBack: () => void;
}

const TILE_SIZE = 32;

export default function MapScreen({ mapId, map, defeatedEnemyIds, onEncounter, onAreaClear, onBack }: Props) {
  const [playerPos, setPlayerPos] = useState({ row: map.playerStart.row, col: map.playerStart.col });
  const [message, setMessage] = useState(`${map.name}をぼうけん中...`);

  const movingRef = useRef(false);
  const tryMoveRef = useRef<(dRow: number, dCol: number) => void>(() => undefined);

  const liveEnemies = map.enemies.filter((e) => !defeatedEnemyIds.includes(e.id));

  // エリアクリア済みかどうかの初期値を記録
  const initiallyCleared = map.enemies.length > 0 && liveEnemies.length === 0;
  const areaCleared = useRef(initiallyCleared);

  const isWalkable = (row: number, col: number): boolean => {
    if (row < 0 || row >= map.tiles.length) return false;
    if (col < 0 || col >= (map.tiles[0]?.length ?? 0)) return false;
    const t = map.tiles[row][col];
    return t === 0 || t === 1;
  };

  // tryMove を ref で安定化してキーボードリスナーの再登録を防ぐ
  const buildTryMove = (pos: { row: number; col: number }, live: MapEnemySpawn[]) =>
    (dRow: number, dCol: number): void => {
      if (movingRef.current) return;
      const newRow = pos.row + dRow;
      const newCol = pos.col + dCol;
      if (!isWalkable(newRow, newCol)) return;

      movingRef.current = true;
      setPlayerPos({ row: newRow, col: newCol });

      const hit = live.find((e) => e.row === newRow && e.col === newCol);
      if (hit) {
        setMessage(`${hit.name}があらわれた！`);
        setTimeout(() => {
          movingRef.current = false;
          onEncounter(hit);
        }, 300);
      } else {
        setTimeout(() => { movingRef.current = false; }, 120);
      }
    };

  // 毎レンダーで ref を最新の playerPos / liveEnemies で更新
  tryMoveRef.current = buildTryMove(playerPos, liveEnemies);

  // キーボードリスナーは一度だけ登録
  useEffect(() => {
    const handleKey = (e: KeyboardEvent): void => {
      switch (e.key) {
        case "ArrowUp":    e.preventDefault(); tryMoveRef.current(-1, 0); break;
        case "ArrowDown":  e.preventDefault(); tryMoveRef.current(1, 0);  break;
        case "ArrowLeft":  e.preventDefault(); tryMoveRef.current(0, -1); break;
        case "ArrowRight": e.preventDefault(); tryMoveRef.current(0, 1);  break;
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  // 全敵撃破チェック: defeatedEnemyIds が変わるたびに確認
  useEffect(() => {
    if (areaCleared.current) return;
    const live = map.enemies.filter((e) => !defeatedEnemyIds.includes(e.id));
    if (live.length === 0 && map.enemies.length > 0) {
      areaCleared.current = true;
      setMessage("このエリアのてきをぜんぶたおした！🎉");
      onAreaClear(mapId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defeatedEnemyIds]);

  return (
    <div className="card screen" style={{ padding: "8px" }}>
      {/* ヘッダー */}
      <div style={{
        background: "#1a3a1a",
        color: "#7ddb7d",
        padding: "8px 10px",
        borderRadius: "8px",
        marginBottom: "8px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <span style={{ fontWeight: "bold", fontSize: "14px" }}>{map.name}</span>
        <span style={{ fontSize: "12px" }}>てき {liveEnemies.length}/{map.enemies.length}</span>
      </div>

      {/* マップエリア (320×288) */}
      <div className="map-area">
        {/* タイル描画 */}
        {map.tiles.map((row, ri) =>
          row.map((tile, ci) => {
            const cls =
              tile === 0 ? "map-tile map-tile-grass" :
              tile === 1 ? "map-tile map-tile-path" :
              tile === 2 ? "map-tile map-tile-wall" :
              "map-tile map-tile-water";
            return (
              <div
                key={`${ri}-${ci}`}
                className={cls}
                style={{ top: ri * TILE_SIZE, left: ci * TILE_SIZE }}
              />
            );
          })
        )}

        {/* 敵シンボル (生存中のみ、ボブアニメ) */}
        {liveEnemies.map((e) => (
          <div
            key={e.id}
            className="map-enemy-alive"
            style={{
              position: "absolute",
              top: e.row * TILE_SIZE,
              left: e.col * TILE_SIZE,
              width: TILE_SIZE,
              height: TILE_SIZE,
              fontSize: "20px",
              lineHeight: `${TILE_SIZE}px`,
              textAlign: "center",
              zIndex: 5,
            }}
          >
            {e.symbol}
          </div>
        ))}

        {/* プレイヤー */}
        <div
          className="map-player"
          style={{
            top: playerPos.row * TILE_SIZE,
            left: playerPos.col * TILE_SIZE,
            fontSize: "20px",
            lineHeight: `${TILE_SIZE}px`,
            textAlign: "center",
          }}
        >
          🧒
        </div>
      </div>

      {/* メッセージバー */}
      <div style={{
        background: "#f4f9ff",
        border: "1px solid #d0d6e0",
        borderRadius: "8px",
        padding: "6px 10px",
        margin: "8px 0",
        fontSize: "13px",
        minHeight: "32px",
        color: "#333",
      }}>
        {message}
      </div>

      {/* Dパッド */}
      <div className="map-dpad" style={{ margin: "0 auto" }}>
        <div />
        <button
          type="button"
          onPointerDown={() => tryMoveRef.current(-1, 0)}
          style={{ margin: 0, padding: 0, fontSize: "20px", borderRadius: "8px", width: "100%", height: "100%" }}
        >▲</button>
        <div />
        <button
          type="button"
          onPointerDown={() => tryMoveRef.current(0, -1)}
          style={{ margin: 0, padding: 0, fontSize: "20px", borderRadius: "8px", width: "100%", height: "100%" }}
        >◀</button>
        <button
          type="button"
          onPointerDown={() => tryMoveRef.current(1, 0)}
          style={{ margin: 0, padding: 0, fontSize: "20px", borderRadius: "8px", width: "100%", height: "100%" }}
        >▼</button>
        <button
          type="button"
          onPointerDown={() => tryMoveRef.current(0, 1)}
          style={{ margin: 0, padding: 0, fontSize: "20px", borderRadius: "8px", width: "100%", height: "100%" }}
        >▶</button>
      </div>

      <button onClick={onBack} style={{ marginTop: "10px", background: "#888" }}>
        もどる
      </button>
    </div>
  );
}
