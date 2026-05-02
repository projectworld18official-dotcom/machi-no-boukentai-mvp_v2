import { useState } from "react";
import type {
  EquippedSkins,
  HeroState,
  JobsState,
  PartyMemberId,
  SkinsState,
  SkinSlot
} from "../types";
import { heroMaster, jobsMaster, memberDisplayName } from "../data/jobs";
import { skinsByCharSlot, getSkin } from "../data/skins";
import { playSE } from "../utils/audio";

interface Props {
  memberId: PartyMemberId;
  hero: HeroState;
  jobs: JobsState;
  skinsState: SkinsState;
  onEquip: (member: PartyMemberId, slot: keyof EquippedSkins, skinId: string | null) => void;
  back: () => void;
}

const TABS: SkinSlot[] = ["body", "special"];
const TAB_LABEL: Record<SkinSlot, string> = {
  body: "ふく",
  weapon: "ぶき",
  special: "ひっさつ"
};

export default function CharacterPreviewScreen({
  memberId,
  hero,
  jobs,
  skinsState,
  onEquip,
  back
}: Props) {
  const [tab, setTab] = useState<SkinSlot>("body");
  const [silentMessage, setSilentMessage] = useState<string | null>(null);

  const isHero = memberId === "hero";
  const emoji = isHero ? heroMaster.emoji : jobsMaster[memberId].emoji;
  const name = memberDisplayName(memberId, hero.name);
  const lv = isHero ? hero.level : jobs[memberId].level;
  const equipped = skinsState.equipped[memberId];
  const equippedBodySkin = getSkin(equipped.body);
  const equippedSpecialSkin = getSkin(equipped.special);

  const tabSkins = skinsByCharSlot(memberId, tab);
  const equippedInTab = tab === "body" ? equipped.body : equipped.special;

  const handleEquip = (skinId: string, owned: boolean): void => {
    if (!owned) {
      playSE("cancel");
      setSilentMessage("まだもっていないよ");
      setTimeout(() => setSilentMessage(null), 1500);
      return;
    }
    playSE("decision");
    onEquip(memberId, tab as keyof EquippedSkins, skinId);
  };

  const previewBg = equippedBodySkin?.bodyColor ?? "#5b8def";
  const previewIsGradient = previewBg.startsWith("linear-gradient");

  return (
    <div className="card screen">
      <h2>{name} のスキン</h2>

      <div
        className="previewHero"
        style={{
          background: previewIsGradient ? previewBg : previewBg,
          borderColor: equippedBodySkin?.borderColor ?? "transparent"
        }}
      >
        {isHero && <span className="heroTag">主人公</span>}
        <span className="lvBadge">Lv.{lv}</span>
        <div className="previewEmoji">{emoji}</div>
        <div className="previewName">{name}</div>
        {equippedSpecialSkin && (
          <div
            className="previewSpecialBadge"
            style={{ background: equippedSpecialSkin.effectColor ?? "#ffd400" }}
          >
            ✨ {equippedSpecialSkin.name}
          </div>
        )}
      </div>

      <div className="previewTabs">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            className={`previewTabButton ${tab === t ? "previewTabButton--active" : ""}`}
            onClick={() => setTab(t)}
          >
            {TAB_LABEL[t]}
          </button>
        ))}
      </div>

      <div className="skinGrid">
        {tabSkins.map((s) => {
          const owned = !!skinsState.owned[s.id];
          const isEquipped = equippedInTab === s.id;
          const showColor = s.bodyColor ?? s.effectColor ?? "#5b8def";
          const isGrad = showColor.startsWith("linear-gradient");
          return (
            <button
              key={s.id}
              type="button"
              className={`skinCard ${isEquipped ? "skinCard--equipped" : ""} ${owned ? "" : "skinCard--locked"}`}
              onClick={() => handleEquip(s.id, owned)}
            >
              <div
                className="skinSwatch"
                style={{
                  background: owned ? (isGrad ? showColor : showColor) : "#222"
                }}
              >
                {!owned && <span className="skinLockMark">?</span>}
              </div>
              <div className="skinCardName">{owned ? s.name : "???"}</div>
              <div className="skinCardRarity">★{s.rarity}</div>
              {isEquipped && <div className="skinEquippedLabel">そうび中!</div>}
            </button>
          );
        })}
      </div>

      {silentMessage && <div className="skinHint">{silentMessage}</div>}

      <button onClick={back}>もどる</button>
    </div>
  );
}
