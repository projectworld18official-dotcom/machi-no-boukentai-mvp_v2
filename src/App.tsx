import { useState } from "react";
import BattleScreen, { type BattleResult } from "./components/BattleScreen";
import CollectionScreen from "./components/CollectionScreen";
import GachaScreen from "./components/GachaScreen";
import HeroNameModal from "./components/HeroNameModal";
import HomeScreen from "./components/HomeScreen";
import PartySetupScreen from "./components/PartySetupScreen";
import { useGameState } from "./hooks/useGameState";
import { heroStats, jobStats } from "./data/jobs";
import type { JobsState, PartyState, SaveData } from "./types";

type Screen = "home" | "battle" | "gacha" | "collection" | "partySetup";

const EXP_PER_LEVEL = 100;

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
  const [latest, setLatest] = useState<string[]>([]);

  const addResult = (ids: string[], cost: number): void => {
    if (data.gems < cost) return;

    const owned = new Set(data.ownedIds);
    const levels = { ...data.levels };

    ids.forEach((id) => {
      owned.add(id);
      if (typeof levels[id] !== "number") levels[id] = 1;
    });

    setData({
      ...data,
      gems: data.gems - cost,
      ownedIds: [...owned],
      levels,
      gachaHistory: [...ids, ...data.gachaHistory].slice(0, 30)
    });

    setLatest(ids);
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

  const handleBattleFinish = (result: BattleResult): void => {
    if (result.outcome === "victory") {
      // 戦闘終了処理: HP/MP 反映、EXP 配分、MP 30% 自動回復、battleStage++
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

      // EXP 配分 (パーティ全員)
      newHero = applyExpToHero(newHero, result.expGain);
      result.allyFinal.forEach((af) => {
        if (af.memberId !== "hero") {
          newJobs = applyExpToJob(newJobs, af.memberId, result.expGain);
        }
      });

      setData({
        ...data,
        gems: data.gems + 50,
        battleStage: data.battleStage + 1,
        hero: newHero,
        jobs: newJobs
      });
    } else {
      // 敗北: HP/MP は戦闘前に戻す (簡易、ステージは進めない)
      let newHero = { ...data.hero, hp: data.hero.maxHp };
      let newJobs: JobsState = {
        ...data.jobs,
        warrior: { ...data.jobs.warrior, hp: data.jobs.warrior.maxHp },
        monk: { ...data.jobs.monk, hp: data.jobs.monk.maxHp },
        mage: {
          ...data.jobs.mage,
          hp: data.jobs.mage.maxHp,
          mp: Math.min(data.jobs.mage.maxMp, data.jobs.mage.mp + Math.floor(data.jobs.mage.maxMp * 0.3))
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

      {!showNameModal && screen === "home" && (
        <HomeScreen
          onMove={(s) => setScreen(s as Screen)}
          hero={data.hero}
          jobs={data.jobs}
          party={data.party}
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
          addResult={addResult}
          latest={latest}
          back={() => setScreen("home")}
        />
      )}

      {!showNameModal && screen === "collection" && (
        <CollectionScreen
          ownedIds={data.legacyChars.ownedIds}
          back={() => setScreen("home")}
        />
      )}
    </div>
  );
}
