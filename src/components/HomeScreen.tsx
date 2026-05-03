import { useEffect, useState } from "react";
import type { HeroState, JobsState, PartyState, SkinsState } from "../types";
import { memberDisplayName, memberEmoji, memberSpriteUrl } from "../data/jobs";
import { getSkin } from "../data/skins";
import { playBGM, playSE, stopBGM, unlockAudio } from "../utils/audio";

interface Props {
  onMove: (screen: string) => void;
  onAdventure: () => void;
  hero: HeroState;
  jobs: JobsState;
  party: PartyState;
  gems: number;
  skins: SkinsState;
  debugUnlocked?: boolean;
  onDebug?: () => void;
}

export default function HomeScreen({
  onMove,
  onAdventure,
  hero,
  jobs,
  party,
  gems,
  skins,
  debugUnlocked,
  onDebug
}: Props) {
  useEffect(() => {
    playBGM("home");
    return () => {
      stopBGM();
    };
  }, []);

  const go = async (screen: string): Promise<void> => {
    await unlockAudio();
    playBGM("home");
    playSE("decision");
    onMove(screen);
  };

  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});
  const handleImgError = (key: string): void => {
    setImgErrors((prev) => ({ ...prev, [key]: true }));
  };

  const partyMembers = [party.member1, party.member2, party.member3].filter(
    (m): m is "hero" | "warrior" | "monk" | "mage" | "youtuber" => m !== null
  );

  return (
    <div className="card screen">
      {debugUnlocked && onDebug && (
        <button className="debugButton" onClick={onDebug}>
          🔧 DEBUG
        </button>
      )}
      <h1>まちの冒険隊</h1>
      <p>{hero.name ? `${hero.name} と なかまたち` : "まちをまもる仲間を集めよう！"}</p>
      <p className="homeGems">💎 {gems}</p>

      <p className="charSelectLabel">いまのパーティ</p>
      <div className="charSelectRow">
        {partyMembers.map((m) => {
          const isHero = m === "hero";
          const lv = isHero ? hero.level : jobs[m].level;
          const name = memberDisplayName(m, hero.name);
          const emoji = memberEmoji(m);
          // 装備中の body スキン色を待機画面に反映 (Phase 2d-3)
          const equippedBodyId = skins.equipped[m]?.body ?? null;
          const equippedBodySkin = getSkin(equippedBodyId);
          const cardBg = equippedBodySkin?.bodyColor ?? "#5b8def";
          const spriteUrl = equippedBodySkin?.imageUrl ?? memberSpriteUrl(m);
          return (
            <div
              key={m}
              className="charCard charCard--active"
              style={{ background: cardBg, cursor: "default" }}
            >
              {isHero && <span className="heroTag">主人公</span>}
              <span className="lvBadge">Lv.{lv}</span>
              {spriteUrl && !imgErrors[m] ? (
                <img
                  src={spriteUrl}
                  alt={name}
                  className="charCardSprite"
                  onError={() => handleImgError(m)}
                />
              ) : (
                <div className="charCardEmoji">{emoji}</div>
              )}
              <div className="charCardName">{name}</div>
            </div>
          );
        })}
      </div>

      <button onClick={() => go("partySetup")}>👥 パーティ編成</button>
      <button
        onClick={async () => { await unlockAudio(); playSE("decision"); onAdventure(); }}
        disabled={partyMembers.length < 2}
      >
        🗺 冒険に出る
      </button>
      <button onClick={() => go("battle")} disabled={partyMembers.length < 2}>
        ⚔️ バトル
      </button>
      <button onClick={() => go("gacha")}>🎁 ガチャ</button>
      <button onClick={() => go("characterSelect")}>📚 なかまいちらん</button>
    </div>
  );
}
