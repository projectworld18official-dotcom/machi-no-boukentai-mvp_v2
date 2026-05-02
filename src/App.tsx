import { useEffect, useState } from "react";
import BattleScreen, { type BattleResult } from "./components/BattleScreen";
import CharacterPreviewScreen from "./components/CharacterPreviewScreen";
import CharacterSelectScreen from "./components/CharacterSelectScreen";
import GachaScreen from "./components/GachaScreen";
import HeroNameModal from "./components/HeroNameModal";
import HomeScreen from "./components/HomeScreen";
import PartySetupScreen from "./components/PartySetupScreen";
import FirstLoginModal from "./components/FirstLoginModal";
import { useGameState } from "./hooks/useGameState";
import { heroStats, jobStats } from "./data/jobs";
import type {
  EquippedSkins,
  JobsState,
  PartyMemberId,
  PartyState,
  SaveData
} from "./types";
import type { GachaPullResult } from "./logic/cosmeticGacha";

type Screen =
  | "home"
  | "battle"
  | "gacha"
  | "characterSelect"
  | "characterPreview"
  | "partySetup";

const EXP_PER_LEVEL = 100;
const FIRST_LOGIN_BONUS = 100;

const applyExpToHero = (hero: SaveData["hero"], exp: number): SaveData["hero"] => {
  let level = hero.level;
  let curExp = hero.exp + exp;
  while (curExp >= level * EXP_PER_LEVEL) {
    curExp -= level * EXP_PER_LEVEL;
    level += 1;
  }
  const stats = heroStats(level);
  return {
    ...hero,
    level,
    exp: curExp,
    maxHp: stats.maxHp,
    hp: Math.min(hero.hp, stats.maxHp)
  };
};

const applyExpToJob = (
  jobs: JobsState,
  jobId: keyof JobsState,
  exp: number
): JobsState => {
  const j = jobs[jobId];
  let level = j.level;
  let curExp = j.exp + exp;
  while (curExp >= level * EXP_PER_LEVEL) {
    curExp -= level * EXP_PER_LEVEL;
    level += 1;
  }
  const stats = jobStats(jobId, level);
  if (jobId === "mage") {
    return {
      ...jobs,
      mage: {
        ...jobs.mage,
        level,
        exp: curExp,
        maxHp: stats.maxHp,
        hp: Math.min(jobs.mage.hp, stats.maxHp),
        maxMp: stats.maxMp ?? jobs.mage.maxMp,
        mp: Math.min(jobs.mage.mp, stats.maxMp ?? jobs.mage.maxMp)
      }
    };
  }
  const baseJob = jobs[jobId];
  return {
    ...jobs,
    [jobId]: {
      ...baseJob,
      level,
      exp: curExp,
      maxHp: stats.maxHp,
      hp: Math.min(baseJob.hp, stats.maxHp)
    }
  };
};

export default function App() {
  const { data, setData } = useGameState();
  const [screen, setScreen] = useState<Screen>("home");
  const [previewMemberId, setPreviewMemberId] = useState<PartyMemberId | null>(null);
  const [stageBonus, setStageBonus] = useState<{ stage: number; gems: number } | null>(null);
  const [firstLoginShown, setFirstLoginShown] = useState(false);

  // 初回ログインボーナス処理: nameSet 完了後の初回 home 表示で一度だけ
  useEffect(() => {
    if (
      data.hero.nameSet &&
      !data.rewards.firstLoginClaimed &&
      !firstLoginShown
    ) {
      setFirstLoginShown(true);
    }
  }, [data.hero.nameSet, data.rewards.firstLoginClaimed, firstLoginShown]);

  const handleClaimFirstLogin = (): void => {
    setData({
      ...data,
      gems: data.gems + FIRST_LOGIN_BONUS,
      rewards: { ...data.rewards, firstLoginClaimed: true }
    });
  };

  // === コスメガチャ結果反映 ===
  const handlePullComplete = (r: { newOwned: string[]; refund: number; cost: number; pulls: GachaPullResult[] }): void => {
    if (data.gems < r.cost) return;
    const owned = { ...data.skins.owned };
    r.newOwned.forEach((id) => {
      owned[id] = true;
    });
    setData({
      ...data,
      gems: data.gems - r.cost + r.refund,
      gachaHistory: [...r.pulls.map((p) => p.skinId), ...data.gachaHistory].slice(0, 30),
      skins: { ...data.skins, owned }
    });
  };

  const handlePartyChange = (party: PartyState): void => {
    setData({ ...data, party });
  };

  const handleHeroNameConfirm = (name: string): void => {
    setData({
      ...data,
      hero: { ...data.hero, name, nameSet: true }
    });
  };

  const handleEquipSkin = (
    member: PartyMemberId,
    slot: keyof EquippedSkins,
    skinId: string | null
  ): void => {
    const equipped = { ...data.skins.equipped };
    equipped[member] = { ...equipped[member], [slot]: skinId };
    setData({ ...data, skins: { ...data.skins, equipped } });
  };

  const handleBattleFinish = (result: BattleResult): void => {
    if (result.outcome === "victory") {
      let newHero = { ...data.hero };
      let newJobs: JobsState = { ...data.jobs };

      result.allyFinal.forEach((af) => {
        if (af.memberId === "hero") {
          newHero = { ...newHero, hp: af.hp, maxHp: af.maxHp };
        } else {
          const j = newJobs[af.memberId];
          if (af.memberId === "mage") {
            const baseMp = af.mp ?? newJobs.mage.mp;
            const baseMaxMp = af.maxMp ?? newJobs.mage.maxMp;
            const restoredMp = Math.min(
              baseMaxMp,
              baseMp + Math.floor(baseMaxMp * 0.3)
            );
            newJobs = {
              ...newJobs,
              mage: {
                ...newJobs.mage,
                hp: af.hp,
                maxHp: af.maxHp,
                mp: restoredMp,
                maxMp: baseMaxMp
              }
            };
          } else {
            newJobs = {
              ...newJobs,
              [af.memberId]: { ...j, hp: af.hp, maxHp: af.maxHp }
            };
          }
        }
      });

      // EXP 配分
      newHero = applyExpToHero(newHero, result.expGain);
      result.allyFinal.forEach((af) => {
        if (af.memberId !== "hero") {
          newJobs = applyExpToJob(newJobs, af.memberId, result.expGain);
        }
      });

      // gems 計算: 基本勝利 + ステージ初回クリアボーナス
      const enemiesCount = result.allyFinal.length; // パーティ人数 (敵数の代理として stage で算出)
      const stageId = String(data.battleStage);
      const isFirstClear = !data.rewards.stagesCleared[stageId];
      const battleGems = Math.floor(data.battleStage * 3 + enemiesCount * 5);
      const stageBonusGems = isFirstClear ? 30 : 0;

      const stagesCleared = { ...data.rewards.stagesCleared };
      if (isFirstClear) stagesCleared[stageId] = true;

      setData({
        ...data,
        gems: data.gems + battleGems + stageBonusGems,
        battleStage: data.battleStage + 1,
        hero: newHero,
        jobs: newJobs,
        rewards: { ...data.rewards, stagesCleared }
      });

      if (isFirstClear) {
        setStageBonus({ stage: data.battleStage, gems: stageBonusGems });
      }
    } else {
      // 敗北: HP は満タン復活、MP も 30% 回復に統一 (Phase 2c-1 reviewer 指摘#9-A 対応)
      const newHero = { ...data.hero, hp: data.hero.maxHp };
      const restoredMageMp = Math.min(
        data.jobs.mage.maxMp,
        data.jobs.mage.mp + Math.floor(data.jobs.mage.maxMp * 0.3)
      );
      const newJobs: JobsState = {
        ...data.jobs,
        warrior: { ...data.jobs.warrior, hp: data.jobs.warrior.maxHp },
        monk: { ...data.jobs.monk, hp: data.jobs.monk.maxHp },
        mage: {
          ...data.jobs.mage,
          hp: data.jobs.mage.maxHp,
          mp: restoredMageMp
        },
        youtuber: { ...data.jobs.youtuber, hp: data.jobs.youtuber.maxHp }
      };
      setData({ ...data, hero: newHero, jobs: newJobs });
    }
    setScreen("home");
  };

  const showNameModal = !data.hero.nameSet;

  return (
    <div className="app">
      {showNameModal && <HeroNameModal onConfirm={handleHeroNameConfirm} />}

      {!showNameModal &&
        firstLoginShown &&
        !data.rewards.firstLoginClaimed && (
          <FirstLoginModal
            amount={FIRST_LOGIN_BONUS}
            onClaim={handleClaimFirstLogin}
          />
        )}

      {!showNameModal && stageBonus && (
        <FirstLoginModal
          amount={stageBonus.gems}
          title={`ステージ ${stageBonus.stage} はじめてクリア!`}
          subtitle="ボーナスをもらった!"
          onClaim={() => setStageBonus(null)}
        />
      )}

      {!showNameModal && screen === "home" && (
        <HomeScreen
          onMove={(s) => setScreen(s as Screen)}
          hero={data.hero}
          jobs={data.jobs}
          party={data.party}
          gems={data.gems}
        />
      )}

      {!showNameModal && screen === "partySetup" && (
        <PartySetupScreen
          jobs={data.jobs}
          party={data.party}
          heroName={data.hero.name}
          onChange={handlePartyChange}
          onConfirm={() => setScreen("home")}
          back={() => setScreen("home")}
        />
      )}

      {!showNameModal && screen === "battle" && (
        <BattleScreen
          key={data.battleStage}
          hero={data.hero}
          jobs={data.jobs}
          party={data.party}
          stage={data.battleStage}
          onFinish={handleBattleFinish}
          back={() => setScreen("home")}
        />
      )}

      {!showNameModal && screen === "gacha" && (
        <GachaScreen
          gems={data.gems}
          skins={data.skins}
          onPullComplete={handlePullComplete}
          back={() => setScreen("home")}
        />
      )}

      {!showNameModal && screen === "characterSelect" && (
        <CharacterSelectScreen
          hero={data.hero}
          jobs={data.jobs}
          skinsState={data.skins}
          onPick={(id) => {
            setPreviewMemberId(id);
            setScreen("characterPreview");
          }}
          back={() => setScreen("home")}
        />
      )}

      {!showNameModal && screen === "characterPreview" && previewMemberId && (
        <CharacterPreviewScreen
          memberId={previewMemberId}
          hero={data.hero}
          jobs={data.jobs}
          skinsState={data.skins}
          onEquip={handleEquipSkin}
          back={() => setScreen("characterSelect")}
        />
      )}
    </div>
  );
}
