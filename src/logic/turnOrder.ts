import type { ActorState, QueuedAction } from "./battleTypes";

// 速度値で降順、同値時は味方優先
export const sortBySpeed = (actions: QueuedAction[]): QueuedAction[] => {
  return [...actions].sort((a, b) => {
    if (b.actor.speed !== a.actor.speed) return b.actor.speed - a.actor.speed;
    if (a.actor.side === "ally" && b.actor.side === "enemy") return -1;
    if (a.actor.side === "enemy" && b.actor.side === "ally") return 1;
    return 0;
  });
};

export const liveAllies = (actors: ActorState[]): ActorState[] =>
  actors.filter((a) => a.side === "ally" && a.hp > 0);

export const liveEnemies = (actors: ActorState[]): ActorState[] =>
  actors.filter((a) => a.side === "enemy" && a.hp > 0);
