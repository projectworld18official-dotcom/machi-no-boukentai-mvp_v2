import { useEffect, useRef, useState } from "react";
import { getCharacter } from "../data/characters";
import { playBGM, playSE, stopBGM } from "../utils/audio";

interface Props {
  selectedId: string;
  level: number;
  stage: number;
  win: () => void;
  back: () => void;
}

interface Popup {
  id: number;
  value: number;
  critical: boolean;
  side: "hero" | "enemy";
}

const CRIT_RATE = 0.2;
const CRIT_MULT = 1.5;
const TAP_LOCK_MS = 800;
const STAGE_CLEAR_MS = 700;

export default function BattleScreen({
  selectedId,
  level,
  stage,
  win,
  back
}: Props) {
  const hero = getCharacter(selectedId);
  const enemyMax = 80 + stage * 25;

  const [heroHp, setHeroHp] = useState(hero.hp);
  const [enemyHp, setEnemyHp] = useState(enemyMax);
  const [flash, setFlash] = useState(false);
  const [msg, setMsg] = useState("まものが あらわれた！");
  const [popups, setPopups] = useState<Popup[]>([]);
  const popupId = useRef(0);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const lastTapRef = useRef(0);
  const clearTimerRef = useRef<number | null>(null);
  const finishedRef = useRef(false);

  const triggerLevelUp = (): void => {
    setShowLevelUp(true);
    setTimeout(() => setShowLevelUp(false), 1500);
  };

  useEffect(() => {
    playBGM("battle");

    return () => {
      stopBGM();

      if (clearTimerRef.current !== null) {
        clearTimeout(clearTimerRef.current);
      }
    };
  }, []);

  const addPopup = (value: number, critical: boolean, side: "hero" | "enemy"): void => {
    const id = popupId.current++;

    setPopups((arr) => [...arr, { id, value, critical, side }]);

    setTimeout(() => {
      setPopups((arr) => arr.filter((p) => p.id !== id));
    }, 900);
  };

  const rollCritical = (base: number): { dmg: number; critical: boolean } => {
    const critical = Math.random() < CRIT_RATE;
    const dmg = critical ? Math.floor(base * CRIT_MULT) : base;

    return { dmg, critical };
  };

  const enemyAttack = (): void => {
    if (isClearing) return;

    const base = 8 + stage * 2;
    const { dmg, critical } = rollCritical(base);

    setHeroHp((v) => Math.max(0, v - dmg));
    setMsg(`てきのこうげき ${dmg} ダメージ${critical ? "！会心" : ""}`);
    addPopup(dmg, critical, "hero");
    playSE("damage");
  };

  // 連打抑制: 直近のタップから TAP_LOCK_MS 経過していない場合は無視。
  const guardTap = (): boolean => {
    const now = Date.now();
    if (now - lastTapRef.current < TAP_LOCK_MS) return false;
    lastTapRef.current = now;
    return true;
  };

  const finishStageClear = (): void => {
    if (finishedRef.current) return;
    finishedRef.current = true;

    if (clearTimerRef.current !== null) {
      clearTimeout(clearTimerRef.current);
      clearTimerRef.current = null;
    }

    win();
  };

  const startStageClear = (): void => {
    if (isClearing) return;

    setIsClearing(true);
    playSE("victory");
    playSE("levelup");
    triggerLevelUp();

    clearTimerRef.current = window.setTimeout(() => {
      finishStageClear();
    }, STAGE_CLEAR_MS);
  };

  const normal = (): void => {
    if (isClearing) return;
    if (!guardTap()) return;

    const { dmg, critical } = rollCritical(hero.attack);
    const next = enemyHp - dmg;

    setEnemyHp(Math.max(0, next));
    setMsg(`${hero.name} のこうげき ${dmg} ダメージ${critical ? "！会心" : ""}`);
    addPopup(dmg, critical, "enemy");
    playSE("attack");

    if (next <= 0) {
      setMsg("ステージクリア！ ジェム+50");
      startStageClear();
      return;
    }

    setTimeout(() => enemyAttack(), 350);
  };

  const skill = (): void => {
    if (isClearing) return;
    if (!guardTap()) return;

    const { dmg, critical } = rollCritical(hero.skillPower);
    const next = enemyHp - dmg;

    setFlash(true);
    setTimeout(() => setFlash(false), 700);

    setEnemyHp(Math.max(0, next));
    setMsg(`${hero.skillName}！！ ${dmg} ダメージ${critical ? "！会心" : ""}`);
    addPopup(dmg, critical, "enemy");
    playSE("attack");

    if (next <= 0) {
      setMsg("ひっさつ勝利！ ジェム+50");
      startStageClear();
      return;
    }

    setTimeout(() => enemyAttack(), 350);
  };

  const handleBack = (): void => {
    if (isClearing) return;
    playSE("cancel");
    back();
  };

  return (
    <div className="card screen">
      <h2>バトル {stage}</h2>

      <div className={`arena ${flash ? "flash" : ""}`}>
        <div className="fighter">
          <div className="big">{hero.emoji}</div>
          <div>
            {hero.name} <span className="lvInline">Lv.{level}</span>
          </div>
          <div>HP {heroHp}</div>
          <div className="popupLayer">
            {popups
              .filter((p) => p.side === "hero")
              .map((p) => (
                <span
                  key={p.id}
                  className={`damagePopup ${p.critical ? "critical" : ""}`}
                >
                  {p.value}
                </span>
              ))}
          </div>
        </div>

        <div className="fighter enemy">
          <div className="big">👾</div>
          <div>まもの</div>
          <div>HP {enemyHp}</div>
          <div className="popupLayer">
            {popups
              .filter((p) => p.side === "enemy")
              .map((p) => (
                <span
                  key={p.id}
                  className={`damagePopup ${p.critical ? "critical" : ""}`}
                >
                  {p.value}
                </span>
              ))}
          </div>
        </div>
      </div>

      <p>{msg}</p>

      <button onClick={normal} disabled={heroHp <= 0 || enemyHp <= 0 || isClearing}>
        こうげき
      </button>

      <button onClick={skill} disabled={heroHp <= 0 || enemyHp <= 0 || isClearing}>
        必殺技
      </button>

      <button onClick={handleBack} disabled={isClearing}>
        もどる
      </button>

      {showLevelUp && <div className="levelUpBanner">LEVEL UP!</div>}

      {isClearing && (
        <>
          <div className="stageClearOverlay" />
          <div className="stageClearText">ステージクリア！</div>
          <button
            type="button"
            className="stageClearSkip"
            onClick={finishStageClear}
          >
            スキップ ▶
          </button>
        </>
      )}
    </div>
  );
}
