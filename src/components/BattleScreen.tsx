import { useState } from "react";
import { getCharacter } from "../data/characters";

interface Props {
  ownedIds: string[];
  stage: number;
  win: () => void;
  back: () => void;
}

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

  const enemyAttack = (): void => {
    const dmg = 8 + stage * 2;
    setHeroHp((v) => Math.max(0, v - dmg));
    setMsg(`てきのこうげき ${dmg} ダメージ`);
  };

  const normal = (): void => {
    const dmg = hero.attack;
    const next = enemyHp - dmg;

    setEnemyHp(Math.max(0, next));
    setMsg(`${hero.name} のこうげき ${dmg} ダメージ`);

    if (next <= 0) {
      win();
      setMsg("しょうり！ ジェム+50");
      return;
    }

    enemyAttack();
  };

  const skill = (): void => {
    const dmg = hero.skillPower;
    const next = enemyHp - dmg;

    setFlash(true);
    setTimeout(() => setFlash(false), 700);

    setEnemyHp(Math.max(0, next));
    setMsg(`${hero.skillName}！！ ${dmg} ダメージ`);

    if (next <= 0) {
      win();
      setMsg("ひっさつ勝利！ ジェム+50");
      return;
    }

    enemyAttack();
  };

  return (
    <div className="card">
      <h2>バトル {stage}</h2>

      <div className={`arena ${flash ? "flash" : ""}`}>
        <div className="fighter">
          <div className="big">{hero.emoji}</div>
          <div>{hero.name}</div>
          <div>HP {heroHp}</div>
        </div>

        <div className="fighter enemy">
          <div className="big">👾</div>
          <div>まもの</div>
          <div>HP {enemyHp}</div>
        </div>
      </div>

      <p>{msg}</p>

      <button onClick={normal} disabled={heroHp <= 0 || enemyHp <= 0}>
        こうげき
      </button>

      <button onClick={skill} disabled={heroHp <= 0 || enemyHp <= 0}>
        必殺技
      </button>

      <button onClick={back}>もどる</button>
    </div>
  );
}
