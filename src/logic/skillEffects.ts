import type { Skill } from "../data/skills";
import type { ActorState } from "./battleTypes";

export interface PopupSpawn {
  actorId: string;
  value: number;
  kind: "damage" | "heal" | "miss" | "crit";
}

export interface ApplyResult {
  log: string[];
  popups: PopupSpawn[];
  // 状態変化はインプレース更新 (ActorState を直接ミューテート)
}

const rand = (min: number, max: number): number =>
  min + Math.random() * (max - min);

// 通常攻撃ダメージ計算
export const computeBasicDamage = (attacker: ActorState, target: ActorState): number => {
  const atk = attacker.attack * (attacker.attackBuff?.mult ?? 1);
  const base = Math.max(1, atk - target.defense * 0.5);
  // ±10% 揺らぎ
  const dmg = Math.floor(base * rand(0.9, 1.1));
  return Math.max(1, dmg);
};

const applyDamageToTarget = (
  raw: number,
  target: ActorState
): number => {
  const reduction = target.defenseBuffPct ?? 0;
  return Math.max(1, Math.floor(raw * (1 - reduction)));
};

export const performBasicAttack = (
  attacker: ActorState,
  target: ActorState
): ApplyResult => {
  if (target.hp <= 0) {
    return { log: [`${attacker.displayName} のこうげき (はずれ)`], popups: [] };
  }

  const raw = computeBasicDamage(attacker, target);
  const dmg = applyDamageToTarget(raw, target);
  target.hp = Math.max(0, target.hp - dmg);

  const popups: PopupSpawn[] = [{ actorId: target.id, value: dmg, kind: "damage" }];
  const log: string[] = [`${attacker.displayName} のこうげき！ ${target.displayName}に ${dmg} ダメージ`];

  // カウンター発動 (モンクの当て身投げ系)
  if (target.counter && target.hp > 0) {
    const counterDmg = Math.max(1, Math.floor(raw * 0.6));
    attacker.hp = Math.max(0, attacker.hp - counterDmg);
    popups.push({ actorId: attacker.id, value: counterDmg, kind: "damage" });
    log.push(`${target.displayName} のカウンター！ ${attacker.displayName}に ${counterDmg} ダメージ`);
    target.counter = false;
  }

  if (target.hp === 0) {
    log.push(`${target.displayName} はたおれた…`);
  }

  return { log, popups };
};

export const applyDefend = (actor: ActorState): ApplyResult => {
  actor.defenseBuffPct = 0.5;
  return {
    log: [`${actor.displayName} はぼうぎょのかまえ！`],
    popups: []
  };
};

export const applySkill = (
  caster: ActorState,
  skill: Skill,
  targets: ActorState[],
  allAllies: ActorState[]
): ApplyResult => {
  const log: string[] = [];
  const popups: PopupSpawn[] = [];

  log.push(`${caster.displayName} は ${skill.name} ！`);

  const e = skill.effect;

  // === ユーチューバー確率発動 ===
  if (typeof e.procChance === "number" && typeof e.enemyHpRatio === "number") {
    if (Math.random() < e.procChance) {
      log.push("せいこう！");
      const liveTargets = targets.filter((t) => t.hp > 0);
      liveTargets.forEach((t) => {
        const raw = Math.max(1, Math.floor(t.hp * (e.enemyHpRatio as number)));
        const dmg = applyDamageToTarget(raw, t);
        t.hp = Math.max(0, t.hp - dmg);
        popups.push({ actorId: t.id, value: dmg, kind: "crit" });
        log.push(`${t.displayName}に ${dmg} ダメージ`);
      });
    } else {
      log.push("しっぱい…");
    }
    return { log, popups };
  }

  // === 自身バフ系 ===
  if (e.selfDefenseUp) {
    caster.defenseBuffPct = e.selfDefenseUp;
  }
  if (e.selfAttackBuff) {
    caster.attackBuff = { ...e.selfAttackBuff, turnsRemaining: e.selfAttackBuff.turns };
  }
  if (e.counter) {
    caster.counter = true;
  }
  if (e.selfRecoilPercent) {
    const recoil = Math.max(1, Math.floor(caster.maxHp * (e.selfRecoilPercent / 100)));
    caster.hp = Math.max(0, caster.hp - recoil);
    popups.push({ actorId: caster.id, value: recoil, kind: "damage" });
    log.push(`${caster.displayName} に反動 ${recoil}`);
  }

  // === 蘇生 ===
  if (typeof e.reviveHpPercent === "number") {
    const target = targets[0];
    if (target && target.hp === 0) {
      const heal = Math.max(1, Math.floor(target.maxHp * e.reviveHpPercent));
      target.hp = heal;
      popups.push({ actorId: target.id, value: heal, kind: "heal" });
      log.push(`${target.displayName} はよみがえった！ HP ${heal}`);
    } else {
      log.push("そせいたいしょうがいない！");
    }
    return { log, popups };
  }

  // === 回復 ===
  if (typeof e.healPercent === "number") {
    const targetList = e.healAllyAll ? allAllies : targets;
    targetList.forEach((t) => {
      if (t.hp <= 0) return;
      const heal = Math.max(1, Math.floor(t.maxHp * (e.healPercent as number)));
      t.hp = Math.min(t.maxHp, t.hp + heal);
      popups.push({ actorId: t.id, value: heal, kind: "heal" });
      log.push(`${t.displayName} のHPが ${heal} かいふく`);
    });
    return { log, popups };
  }

  // === 攻撃技 ===
  if (typeof e.multiplier === "number") {
    const hits = e.hits ?? 1;
    const liveTargets = targets.filter((t) => t.hp > 0);

    for (let h = 0; h < hits; h++) {
      liveTargets.forEach((t) => {
        if (t.hp <= 0) return;
        const atk = caster.attack * (caster.attackBuff?.mult ?? 1);
        const baseRaw = Math.max(1, atk - t.defense * 0.4);
        const raw = Math.floor(baseRaw * (e.multiplier as number) * rand(0.92, 1.08));
        const dmg = applyDamageToTarget(raw, t);
        t.hp = Math.max(0, t.hp - dmg);
        popups.push({ actorId: t.id, value: dmg, kind: hits > 1 ? "damage" : "crit" });
        log.push(`${t.displayName}に ${dmg} ダメージ`);

        // 麻痺判定
        if (typeof e.paralyzeChance === "number" && Math.random() < e.paralyzeChance && t.hp > 0) {
          t.paralyzed = true;
          log.push(`${t.displayName} は まひした！`);
        }
      });
    }
  }

  return { log, popups };
};

export const consumeSkillCost = (caster: ActorState, skill: Skill): boolean => {
  if (skill.costType === "hpPercent") {
    const cost = Math.max(1, Math.floor(caster.maxHp * (skill.costValue / 100)));
    if (caster.hp <= cost) return false;
    caster.hp -= cost;
    return true;
  }
  if (skill.costType === "mp") {
    if (typeof caster.mp !== "number") return false;
    if (caster.mp < skill.costValue) return false;
    caster.mp -= skill.costValue;
    return true;
  }
  return false;
};

export const canUseSkill = (caster: ActorState, skill: Skill): boolean => {
  if (skill.costType === "hpPercent") {
    const cost = Math.max(1, Math.floor(caster.maxHp * (skill.costValue / 100)));
    return caster.hp > cost;
  }
  if (skill.costType === "mp") {
    if (typeof caster.mp !== "number") return false;
    return caster.mp >= skill.costValue;
  }
  return false;
};
