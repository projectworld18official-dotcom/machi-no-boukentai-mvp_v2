import { useEffect } from "react";
import type { HeroState, JobsState, PartyState } from "../types";
import { memberDisplayName, memberEmoji } from "../data/jobs";
import { playBGM, playSE, stopBGM, unlockAudio } from "../utils/audio";

interface Props {
  onMove: (screen: string) => void;
  hero: HeroState;
  jobs: JobsState;
  party: PartyState;
  gems: number;
  debugUnlocked?: boolean;
  onDebug?: () => void;
}

export default function HomeScreen({
  onMove,
  hero,
  jobs,
  party,
  gems,
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
          return (
            <div
              key={m}
              className="charCard charCard--active"
              style={{ background: "#5b8def", cursor: "default" }}
            >
              {isHero && <span className="heroTag">主人公</span>}
              <span className="lvBadge">Lv.{lv}</span>
              <div className="charCardEmoji">{emoji}</div>
              <div className="charCardName">{name}</div>
            </div>
          );
        })}
      </div>

      <button onClick={() => go("partySetup")}>👥 パーティ編成</button>
      <button onClick={() => go("battle")} disabled={partyMembers.length < 2}>
        ⚔️ バトル
      </button>
      <button onClick={() => go("gacha")}>🎁 ガチャ</button>
      <button onClick={() => go("characterSelect")}>📚 なかまいちらん</button>
    </div>
  );
}
