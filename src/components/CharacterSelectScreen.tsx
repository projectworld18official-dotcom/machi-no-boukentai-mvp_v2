import type { HeroState, JobsState, PartyMemberId, SkinsState } from "../types";
import { heroMaster, jobsMaster, memberDisplayName } from "../data/jobs";
import { skinsByChar } from "../data/skins";
import { playSE } from "../utils/audio";

interface Props {
  hero: HeroState;
  jobs: JobsState;
  skinsState: SkinsState;
  onPick: (id: PartyMemberId) => void;
  back: () => void;
}

const ALL_MEMBERS: PartyMemberId[] = ["hero", "warrior", "monk", "mage", "youtuber"];

export default function CharacterSelectScreen({
  hero,
  jobs,
  skinsState,
  onPick,
  back
}: Props) {
  const handlePick = (id: PartyMemberId): void => {
    playSE("decision");
    onPick(id);
  };

  const handleBack = (): void => {
    playSE("cancel");
    back();
  };

  return (
    <div className="card screen">
      <h2>なかまいちらん</h2>
      <div className="collectionHelp">
        <p>カードをタップしてスキンを見られるよ！</p>
        <p>ガチャでなかまをかざろう。</p>
        <p>★3 / ★4 / ★5 でレアリティがちがうよ。</p>
      </div>

      <div className="charSelectRow charSelectRow--wrap">
        {ALL_MEMBERS.map((id) => {
          const isHero = id === "hero";
          const lv = isHero ? hero.level : jobs[id].level;
          const emoji = isHero ? heroMaster.emoji : jobsMaster[id].emoji;
          const name = memberDisplayName(id, hero.name);
          const allCharSkins = skinsByChar(id);
          const ownedCount = allCharSkins.filter((s) => skinsState.owned[s.id]).length;
          return (
            <button
              key={id}
              type="button"
              className="charCard"
              style={{ background: "#5b8def" }}
              onClick={() => handlePick(id)}
            >
              {isHero && <span className="heroTag">主人公</span>}
              <span className="lvBadge">Lv.{lv}</span>
              <div className="charCardEmoji">{emoji}</div>
              <div className="charCardName">{name}</div>
              <div className="skinCountBadge">{ownedCount}/{allCharSkins.length}</div>
            </button>
          );
        })}
      </div>

      <button onClick={handleBack}>もどる</button>
    </div>
  );
}
