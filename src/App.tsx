import { useEffect, useState } from "react";
import AreaSelectScreen from "./components/AreaSelectScreen";
import BattleScreen, { type BattleResult } from "./components/BattleScreen";
import CharacterPreviewScreen from "./components/CharacterPreviewScreen";
import CharacterSelectScreen from "./components/CharacterSelectScreen";
import DebugMenu from "./components/DebugMenu";
import GachaScreen from "./components/GachaScreen";
import HeroNameModal from "./components/HeroNameModal";
import HomeScreen from "./components/HomeScreen";
import MapScreen from "./components/MapScreen";
import PartySetupScreen from "./components/PartySetupScreen";
import FirstLoginModal from "./components/FirstLoginModal";
import { useGameState } from "./hooks/useGameState";
import { heroStats, jobStats } from "./data/jobs";
import { MAPS, MAP_ENEMY_DEFS, type MapEnemySpawn } from "./data/mapData";
import type { ActorState } from "./logic/battleTypes";
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
  | "partySetup"
  | "debug"
  | "area-select"
  | "map";

const DEBUG_KEY = "kakakayoyoyo-debug";
const DEBUG_FLAG = "debugUnlocked";

// Phase 2d-2: 裏ワザ — 主人公名がこのいずれかなら Lv20 スタート (隠し要素、演出なし)
const NEWSPAPER_KEYWORDS = ["しんぶん", "新聞", "シンブン"];

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

const buildMapEnemy = (spawn: MapEnemySpawn): ActorState => {
  const def = MAP_ENEMY_DEFS[spawn.enemyType];
  return {
    id: "enemy_0",
    side: "enemy",
    displayName: def.name,
    emoji: def.symbol,
    level: def.level,
    hp: def.hp,
    maxHp: def.hp,
    attack: def.attack,
    defense: def.defense,
    speed: def.speed,
  };
};

export default function App() {
  const { data, setData } = useGameState();
  const [screen, setScreen] = useState<Screen>("home");
  const [previewMemberId, setPreviewMemberId] = useState<PartyMemberId | null>(null);
  const [stageBonus, setStageBonus] = useState<{ stage: number; gems: number } | null>(null);
  const [firstLoginShown, setFirstLoginShown] = useState(false);
  const [debugUnlocked, setDebugUnlocked] = useState<boolean>(
    () => localStorage.getItem(DEBUG_FLAG) === "true"
  );

  // マップ歩行システム state
  const [currentMapId, setCurrentMapId] = useState<string>("minato-mirai");
  const [defeatedEnemyIds, setDefeatedEnemyIds] = useState<string[]>([]);
  const [clearedMapIds, setClearedMapIds] = useState<string[]>([]);
  const [pendingMapEnemy, setPendingMapEnemy] = useState<MapEnemySpawn | null>(null);

  // URLパラメータ ?debug=kakakayoyoyo-debug でデバッグメニュー有効化 (司令官専用)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("debug") === DEBUG_KEY) {
      localStorage.setItem(DEBUG_FLAG, "true");
      setDebugUnlocked(true);
    }
  }, []);

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
    const isSecret = NEWSPAPER_KEYWORDS.includes(name);
    if (isSecret) {
      const stats = heroStats(20);
      setData({
        ...data,
        hero: {
          ...data.hero,
          name,
          nameSet: true,
          level: 20,
          exp: 0,
          hp: stats.maxHp,
          maxHp: stats.maxHp
        }
      });
      return;
    }
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
    const isMapBattle = pendingMapEnemy !== null;

    if (result.outcome === "victory") {
      let newHero = { ...data.hero };
      let newJobs: JobsState = { ...data.jobs };

      // HP/MP を戦闘後の値に更新 (通常・マップ共通)
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

      // EXP 配分 (通常・マップ共通)
      newHero = applyExpToHero(newHero, result.expGain);
      result.allyFinal.forEach((af) => {
        if (af.memberId !== "hero") {
          newJobs = applyExpToJob(newJobs, af.memberId, result.expGain);
        }
      });

      if (isMapBattle) {
        // マップバトル: ステージ進行なし、gems なし
        setData({ ...data, hero: newHero, jobs: newJobs });

        const newDefeated = [...defeatedEnemyIds, pendingMapEnemy!.id];
        setDefeatedEnemyIds(newDefeated);

        // エリアクリア判定
        const currentMap = MAPS.find((m) => m.id === currentMapId);
        if (
          currentMap &&
          currentMap.enemies.every((e) => newDefeated.includes(e.id)) &&
          !clearedMapIds.includes(currentMapId)
        ) {
          setClearedMapIds((prev) => [...prev, currentMapId]);
        }

        setPendingMapEnemy(null);
        setScreen("map");
      } else {
        // 通常バトル: ステージ進行 + gems 獲得
        const enemiesCount = result.allyFinal.length;
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
        setScreen("home");
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

      if (isMapBattle) {
        setPendingMapEnemy(null);
        setScreen("map");
      } else {
        setScreen("home");
      }
    }
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
          onAdventure={() => setScreen("area-select")}
          hero={data.hero}
          jobs={data.jobs}
          party={data.party}
          gems={data.gems}
          skins={data.skins}
          debugUnlocked={debugUnlocked}
          onDebug={() => setScreen("debug")}
        />
      )}

      {!showNameModal && screen === "debug" && (
        <DebugMenu
          data={data}
          setData={setData}
          onClose={() => setScreen("home")}
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
          key={pendingMapEnemy ? pendingMapEnemy.id : data.battleStage}
          hero={data.hero}
          jobs={data.jobs}
          party={data.party}
          stage={data.battleStage}
          mapEnemies={pendingMapEnemy ? [buildMapEnemy(pendingMapEnemy)] : undefined}
          onFinish={handleBattleFinish}
          back={() => {
            if (pendingMapEnemy) {
              setPendingMapEnemy(null);
              setScreen("map");
            } else {
              setScreen("home");
            }
          }}
        />
      )}

      {!showNameModal && screen === "area-select" && (
        <AreaSelectScreen
          clearedMapIds={clearedMapIds}
          onSelect={(mapId) => {
            setCurrentMapId(mapId);
            setScreen("map");
          }}
          onBack={() => setScreen("home")}
        />
      )}

      {!showNameModal && screen === "map" && (() => {
        const currentMap = MAPS.find((m) => m.id === currentMapId) ?? MAPS[0];
        return (
          <MapScreen
            key={currentMapId}
            mapId={currentMapId}
            map={currentMap}
            defeatedEnemyIds={defeatedEnemyIds}
            onEncounter={(enemy) => {
              setPendingMapEnemy(enemy);
              setScreen("battle");
            }}
            onAreaClear={(mapId) => {
              setClearedMapIds((prev) =>
                prev.includes(mapId) ? prev : [...prev, mapId]
              );
            }}
            onBack={() => setScreen("area-select")}
          />
        );
      })()}

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
