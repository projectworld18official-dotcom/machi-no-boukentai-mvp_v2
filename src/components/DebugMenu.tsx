import { useState } from "react";
import type { JobsState, SaveData } from "../types";
import { heroStats, jobStats } from "../data/jobs";
import { skins } from "../data/skins";

interface Props {
  data: SaveData;
  setData: (d: SaveData) => void;
  onClose: () => void;
}

const MAX_LEVEL = 99;

const recomputeJobs = (jobs: JobsState, level: number): JobsState => {
  const w = jobStats("warrior", level);
  const mo = jobStats("monk", level);
  const ma = jobStats("mage", level);
  const yt = jobStats("youtuber", level);
  return {
    warrior: { ...jobs.warrior, level, hp: w.maxHp, maxHp: w.maxHp },
    monk: { ...jobs.monk, level, hp: mo.maxHp, maxHp: mo.maxHp },
    mage: {
      ...jobs.mage,
      level,
      hp: ma.maxHp,
      maxHp: ma.maxHp,
      mp: ma.maxMp ?? jobs.mage.maxMp,
      maxMp: ma.maxMp ?? jobs.mage.maxMp
    },
    youtuber: { ...jobs.youtuber, level, hp: yt.maxHp, maxHp: yt.maxHp }
  };
};

export default function DebugMenu({ data, setData, onClose }: Props) {
  const [stageInput, setStageInput] = useState<string>(String(data.battleStage));

  const addGems = (amount: number) => {
    setData({ ...data, gems: data.gems + amount });
  };

  const allLvMax = () => {
    if (!window.confirm("ぜんいん Lv99 にする?")) return;
    const heroS = heroStats(MAX_LEVEL);
    setData({
      ...data,
      hero: {
        ...data.hero,
        level: MAX_LEVEL,
        hp: heroS.maxHp,
        maxHp: heroS.maxHp
      },
      jobs: recomputeJobs(data.jobs, MAX_LEVEL)
    });
  };

  const heroPlus5 = () => {
    const newLevel = Math.min(MAX_LEVEL, data.hero.level + 5);
    const s = heroStats(newLevel);
    setData({
      ...data,
      hero: {
        ...data.hero,
        level: newLevel,
        hp: s.maxHp,
        maxHp: s.maxHp
      }
    });
  };

  const unlockAllSkins = () => {
    if (!window.confirm("スキンを全部もらう?")) return;
    const owned = { ...data.skins.owned };
    skins.forEach((s) => {
      owned[s.id] = true;
    });
    setData({ ...data, skins: { ...data.skins, owned } });
  };

  const setStage = () => {
    const n = parseInt(stageInput, 10);
    if (!Number.isFinite(n) || n < 1) {
      window.alert("1いじょうの数字をいれてね");
      return;
    }
    setData({ ...data, battleStage: n });
  };

  const fullHeal = () => {
    setData({
      ...data,
      hero: { ...data.hero, hp: data.hero.maxHp },
      jobs: {
        ...data.jobs,
        warrior: { ...data.jobs.warrior, hp: data.jobs.warrior.maxHp },
        monk: { ...data.jobs.monk, hp: data.jobs.monk.maxHp },
        mage: {
          ...data.jobs.mage,
          hp: data.jobs.mage.maxHp,
          mp: data.jobs.mage.maxMp
        },
        youtuber: { ...data.jobs.youtuber, hp: data.jobs.youtuber.maxHp }
      }
    });
  };

  const allReset = () => {
    if (!window.confirm("ほんとうにぜんぶリセットする?")) return;
    if (!window.confirm("もとにもどせないよ。いいの?")) return;
    localStorage.clear();
    window.location.reload();
  };

  const disableDebug = () => {
    if (!window.confirm("デバッグメニューを無効にする?")) return;
    localStorage.removeItem("debugUnlocked");
    window.location.reload();
  };

  return (
    <div className="debugMenuOverlay">
      <div className="debugMenuBox">
        <h2 className="debugMenuTitle">🔧 DEBUG MENU</h2>
        <p className="debugMenuWarn">⚠️ 開発者専用</p>

        <button className="debugMenuItem" onClick={() => addGems(1000)}>
          💎 gems +1000
        </button>
        <button className="debugMenuItem" onClick={() => addGems(10000)}>
          💎 gems +10000
        </button>
        <button className="debugMenuItem" onClick={allLvMax}>
          ⬆️ 全キャラ Lv MAX (Lv99)
        </button>
        <button className="debugMenuItem" onClick={heroPlus5}>
          ⬆️ 主人公 Lv +5
        </button>
        <button className="debugMenuItem" onClick={unlockAllSkins}>
          🎁 全スキン解放
        </button>

        <div className="debugMenuStageRow">
          <input
            className="debugMenuStageInput"
            type="number"
            min={1}
            value={stageInput}
            onChange={(e) => setStageInput(e.target.value)}
          />
          <button className="debugMenuItem debugMenuStageBtn" onClick={setStage}>
            🗺️ ステージ設定
          </button>
        </div>

        <button className="debugMenuItem" onClick={fullHeal}>
          ❤️ パーティ全回復
        </button>
        <button className="debugMenuItem debugMenuItemDanger" onClick={allReset}>
          🗑️ オールリセット
        </button>
        <button className="debugMenuItem debugMenuItemDanger" onClick={disableDebug}>
          🚪 デバッグを無効化
        </button>

        <button className="debugMenuItem debugMenuItemBack" onClick={onClose}>
          ✖️ もどる
        </button>
      </div>
    </div>
  );
}
