import { useEffect } from "react";
import type { HeroState, JobsState, PartyState } from "../types";
import { jobsMaster, memberDisplayName, memberEmoji } from "../data/jobs";
import { playBGM, playSE, stopBGM, unlockAudio } from "../utils/audio";

interface Props {
  onMove: (screen: string) => void;
  hero: HeroState;
  jobs: JobsState;
  party: PartyState;
}

export default function HomeScreen({
  onMove,
  hero,
  jobs,
  party
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
      <h1>まちの冒険隊</h1>
      <p>{hero.name ? `${hero.name} と なかまたち` : "まちをまもる仲間を集めよう！"}</p>

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

      <p className="charSelectLabel">なかまいちらん</p>
      <div className="charSelectRow">
        {(["warrior", "monk", "mage", "youtuber"] as const).map((id) => {
          const j = jobsMaster[id];
          const lv = jobs[id].level;
          const inParty = partyMembers.includes(id);
          return (
            <div
              key={id}
              className={`charCard ${inParty ? "charCard--active" : ""}`}
              style={{ background: "#5b8def", cursor: "default" }}
            >
              <span className="lvBadge">Lv.{lv}</span>
              <div className="charCardEmoji">{j.emoji}</div>
              <div className="charCardName">{j.displayName}</div>
            </div>
          );
        })}
      </div>

      <button onClick={() => go("partySetup")}>👥 パーティ編成</button>
      <button onClick={() => go("battle")} disabled={partyMembers.length < 2}>
        ⚔️ バトル
      </button>
      <button onClick={() => go("gacha")}>🎁 ガチャ</button>
      <button onClick={() => go("collection")}>📚 なかま</button>
    </div>
  );
}
