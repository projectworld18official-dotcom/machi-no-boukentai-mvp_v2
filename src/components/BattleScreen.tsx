import { useEffect, useRef, useState } from "react";
import { getCharacter } from "../data/characters";
import { playBGM, playSE, stopBGM } from "../utils/audio";

interface Props {
  ownedIds: string[];
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

export default function BattleScreen({
  ownedIds,
  stage,
  win,
  back
}: Props) {
  const hero = getCharacter(ownedIds[0]);
  const enemyMax = 80 + stage * 25;

  const [heroHp, setHeroHp] = useState(hero.hp);
  const [enemyHp, setEnemyHp] = useState(enemyMax);
  const [flash, setFlash] = useState(false);
  const [msg, setMsg] = useState("まものが あらわれた！");
  const [popups, setPopups] = useState<Popup[]>([]);
  const popupId = useRef(0);

  useEffect(() => {
    playBGM("battle");

    return () => {
      stopBGM();
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
    const base = 8 + stage * 2;
    const { dmg, critical } = rollCritical(base);

    setHeroHp((v) => Math.max(0, v - dmg));
    setMsg(`てきのこうげき ${dmg} ダメージ${critical ? "！会心" : ""}`);
    addPopup(dmg, critical, "hero");
    playSE("damage");
  };

  const normal = (): void => {
    const { dmg, critical } = rollCritical(hero.attack);
    const next = enemyHp - dmg;

    setEnemyHp(Math.max(0, next));
    setMsg(`${hero.name} のこうげき ${dmg} ダメージ${critical ? "！会心" : ""}`);
    addPopup(dmg, critical, "enemy");
    playSE("attack");

    if (next <= 0) {
      win();
      setMsg("しょうり！ ジェム+50");
      playSE("levelup");
      return;
    }

    setTimeout(() => enemyAttack(), 350);
  };

  const skill = (): void => {
    const { dmg, critical } = rollCritical(hero.skillPower);
    const next = enemyHp - dmg;

    setFlash(true);
    setTimeout(() => setFlash(false), 700);

    setEnemyHp(Math.max(0, next));
    setMsg(`${hero.skillName}！！ ${dmg} ダメージ${critical ? "！会心" : ""}`);
    addPopup(dmg, critical, "enemy");
    playSE("attack");

    if (next <= 0) {
      win();
      setMsg("ひっさつ勝利！ ジェム+50");
      playSE("levelup");
      return;
    }

    setTimeout(() => enemyAttack(), 350);
  };

  const handleBack = (): void => {
    playSE("cancel");
    back();
  };

  return (
    <div className="card screen">
      <h2>バトル {stage}</h2>

      <div className={`arena ${flash ? "flash" : ""}`}>
        <div className="fighter">
          <div className="big">{hero.emoji}</div>
          <div>{hero.name}</div>
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

      <button onClick={normal} disabled={heroHp <= 0 || enemyHp <= 0}>
        こうげき
      </button>

      <button onClick={skill} disabled={heroHp <= 0 || enemyHp <= 0}>
        必殺技
      </button>

      <button onClick={handleBack}>もどる</button>
    </div>
  );
}
