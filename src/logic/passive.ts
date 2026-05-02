import type { ActorState } from "./battleTypes";
import type { PopupSpawn } from "./skillEffects";

export interface PassiveResult {
  log: string[];
  popups: PopupSpawn[];
  triggered: boolean;
}

// ルメナリス: ターン終了時に主人公が居れば確率発動、味方全員 HP 5-8% (Lv50+ で 7-10%) 回復
export const tryLumenaris = (
  hero: ActorState | null,
  allies: ActorState[]
): PassiveResult => {
  if (!hero || hero.hp <= 0) return { log: [], popups: [], triggered: false };

  const procChance = hero.level >= 30 ? 0.33 : 0.25;
  if (Math.random() >= procChance) return { log: [], popups: [], triggered: false };

  const minPct = hero.level >= 50 ? 7 : 5;
  const maxPct = hero.level >= 50 ? 10 : 8;
  const log: string[] = [`${hero.displayName} のルメナリス！`];
  const popups: PopupSpawn[] = [];

  allies.forEach((a) => {
    if (a.hp <= 0) return;
    const pct = (minPct + Math.random() * (maxPct - minPct)) / 100;
    const heal = Math.max(1, Math.floor(a.maxHp * pct));
    a.hp = Math.min(a.maxHp, a.hp + heal);
    popups.push({ actorId: a.id, value: heal, kind: "heal" });
    log.push(`${a.displayName} +${heal}`);
  });

  return { log, popups, triggered: true };
};
