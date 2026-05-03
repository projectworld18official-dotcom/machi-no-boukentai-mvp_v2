import { useEffect, useState } from "react";
import type { Rarity, SkinsState } from "../types";
import { getSkin } from "../data/skins";
import {
  GACHA_COST_SINGLE,
  GACHA_COST_TEN,
  evaluatePulls,
  rollSingleSkin,
  rollTenSkins,
  type GachaPullResult
} from "../logic/cosmeticGacha";
import { playBGM, playSE, stopBGM } from "../utils/audio";
import { jobsMaster } from "../data/jobs";

interface Props {
  gems: number;
  skins: SkinsState;
  onPullComplete: (result: { newOwned: string[]; refund: number; cost: number; pulls: GachaPullResult[] }) => void;
  back: () => void;
}

const rarityLabel = (r: Rarity): string => {
  if (r === 5) return "超レア";
  if (r === 4) return "レア";
  return "ノーマル";
};

const rarityClassname = (r: Rarity): string => `effect${r}`;
const rarityCapsuleClass = (r: Rarity): string => `rarity${r}`;

export default function GachaScreen({ gems, skins, onPullComplete, back }: Props) {
  const [latest, setLatest] = useState<GachaPullResult[]>([]);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});
  const handleImgError = (key: string): void => {
    setImgErrors((prev) => ({ ...prev, [key]: true }));
  };

  useEffect(() => {
    playBGM("home");
    return () => {
      stopBGM();
    };
  }, []);

  const pull = (single: boolean): void => {
    const cost = single ? GACHA_COST_SINGLE : GACHA_COST_TEN;
    if (gems < cost) return;

    const ids = single ? [rollSingleSkin()] : rollTenSkins();
    const evaluated = evaluatePulls(ids, skins.owned);
    const newOwned = evaluated.filter((p) => !p.duplicate).map((p) => p.skinId);
    const refund = evaluated.reduce((s, p) => s + p.refundGems, 0);

    setLatest(evaluated);
    playSE("gacha");
    onPullComplete({ newOwned, refund, cost, pulls: evaluated });
  };

  const handleBack = (): void => {
    playSE("cancel");
    back();
  };

  const topRarity = latest.reduce((max, p) => Math.max(max, p.rarity), 0 as number);

  return (
    <div className="card screen">
      <h2>コスメガチャ</h2>
      <p>💎 {gems}</p>
      <p>★5=6% / ★4=24% / ★3=70%（10連は最後の1体が最低★4）</p>
      <p className="gachaHelp">スキン40種から排出！ 同じものは gems 返還!</p>

      <button onClick={() => pull(true)} disabled={gems < GACHA_COST_SINGLE}>
        単発 30
      </button>
      <button onClick={() => pull(false)} disabled={gems < GACHA_COST_TEN}>
        10連 300
      </button>

      <div className="resultBox">
        {latest.map((p, i) => {
          const skin = getSkin(p.skinId);
          if (!skin) return null;
          const charDisplay = skin.charId === "hero" ? "🦸" : jobsMaster[skin.charId].emoji;
          const isGradient = (skin.bodyColor ?? "").startsWith("linear-gradient");
          const capsuleKey = `${p.skinId}-${i}`;
          return (
            <div
              key={capsuleKey}
              className={`capsule ${rarityCapsuleClass(p.rarity)} ${rarityClassname(p.rarity)}`}
              style={{
                background: isGradient
                  ? skin.bodyColor
                  : skin.bodyColor ?? skin.effectColor ?? "#5b8def",
                opacity: p.duplicate ? 0.65 : 1
              }}
            >
              {skin.imageUrl && !imgErrors[capsuleKey] ? (
                <img
                  src={skin.imageUrl}
                  alt={skin.name}
                  className="capsuleSprite"
                  onError={() => handleImgError(capsuleKey)}
                />
              ) : (
                <div className="big">{charDisplay}</div>
              )}
              <div>{skin.name}</div>
              <div>★{skin.rarity} {rarityLabel(p.rarity)}</div>
              {p.duplicate && (
                <div className="duplicateLabel">すでにもっている! +{p.refundGems}💎</div>
              )}
            </div>
          );
        })}
      </div>

      {topRarity === 5 && latest.length > 0 && (
        <div key={`burst-${latest.map((l) => l.skinId).join("-")}`} className="rainbowBurst" />
      )}

      <button onClick={handleBack}>もどる</button>
    </div>
  );
}
