import { useEffect, useMemo, useRef, useState } from "react";
import type { JobsState, MageState, PartyMemberId, PartyState, HeroState } from "../types";
import { heroStats, jobStats, memberDisplayName, memberEmoji, memberSpriteUrl } from "../data/jobs";
import type { Skill } from "../data/skills";
import { unlockedSkills } from "../data/skills";
import { playBGM, playSE, stopBGM } from "../utils/audio";
import type { ActorState, QueuedAction } from "../logic/battleTypes";
import {
  applyDefend,
  applySkill,
  canUseSkill,
  consumeSkillCost,
  performBasicAttack
} from "../logic/skillEffects";
import { liveAllies, liveEnemies, sortBySpeed } from "../logic/turnOrder";
import { tryLumenaris } from "../logic/passive";

// ステージ番号 → バトル背景画像パス (6ステージ循環)
const STAGE_BG_URLS: Record<number, string> = {
  1: "/battle_backgrounds/stage1.png",
  2: "/battle_backgrounds/stage2.png",
  3: "/battle_backgrounds/stage3.png",
  4: "/battle_backgrounds/stage4.png",
  5: "/battle_backgrounds/stage5.png",
  6: "/battle_backgrounds/stage6.png"
};

// キャラごとのテーマカラー (Phase 2d-3 レベルアップ演出用)
const MEMBER_COLORS: Record<PartyMemberId, string> = {
  hero: "#5b8def",
  warrior: "#7d8fb3",
  monk: "#fafafa",
  mage: "#b76dff",
  youtuber: "#cf3a3a"
};

export interface BattleResult {
  outcome: "victory" | "defeat";
  expGain: number;
  allyFinal: Array<{
    memberId: PartyMemberId;
    hp: number;
    maxHp: number;
    mp?: number;
    maxMp?: number;
  }>;
}

interface Props {
  hero: HeroState;
  jobs: JobsState;
  party: PartyState;
  stage: number;
  onFinish: (result: BattleResult) => void;
  back: () => void;
  mapEnemies?: ActorState[];
}

interface PendingPopup {
  id: number;
  actorId: string;
  value: number;
  kind: "damage" | "heal" | "miss" | "crit";
}

const buildAllyActor = (
  memberId: PartyMemberId,
  hero: HeroState,
  jobs: JobsState
): ActorState => {
  if (memberId === "hero") {
    const s = heroStats(hero.level);
    return {
      id: "ally_hero",
      side: "ally",
      memberId,
      displayName: hero.name || "しゅじんこう",
      emoji: memberEmoji(memberId),
      level: hero.level,
      hp: hero.hp,
      maxHp: s.maxHp,
      attack: s.attack,
      defense: s.defense,
      speed: s.speed
    };
  }

  const j = jobs[memberId];
  const s = jobStats(memberId, j.level);
  const isMage = memberId === "mage";
  return {
    id: `ally_${memberId}`,
    side: "ally",
    memberId,
    displayName: memberDisplayName(memberId, hero.name),
    emoji: memberEmoji(memberId),
    level: j.level,
    hp: j.hp,
    maxHp: s.maxHp,
    mp: isMage ? (j as MageState).mp : undefined,
    maxMp: isMage ? s.maxMp : undefined,
    attack: s.attack,
    defense: s.defense,
    speed: s.speed
  };
};

const buildEnemies = (stage: number): ActorState[] => {
  // ステージ 1: 1体, 4: 2体, 7: 3体 (大体3ステージごとに増える、上限3)
  const count = Math.min(3, 1 + Math.floor((stage - 1) / 3));
  const enemies: ActorState[] = [];
  for (let i = 0; i < count; i++) {
    const baseHp = 60 + stage * 18 + i * 8;
    const baseAtk = 8 + stage * 2;
    enemies.push({
      id: `enemy_${i}`,
      side: "enemy",
      displayName: `まもの${count > 1 ? i + 1 : ""}`,
      emoji: "👾",
      level: stage,
      hp: baseHp,
      maxHp: baseHp,
      attack: baseAtk,
      defense: 4 + Math.floor(stage / 2),
      speed: 6 + Math.floor(stage / 4)
    });
  }
  return enemies;
};

type Phase =
  | "selecting"        // プレイヤーがコマンド入力中
  | "executing"        // 速度順実行中
  | "stageClear"       // ステージクリア演出
  | "defeated";        // 全滅

export default function BattleScreen({
  hero,
  jobs,
  party,
  stage,
  onFinish,
  back,
  mapEnemies
}: Props) {
  // パーティメンバー (null は除外)
  const partyIds = useMemo<PartyMemberId[]>(() => {
    const arr: PartyMemberId[] = ["hero"];
    if (party.member2) arr.push(party.member2);
    if (party.member3) arr.push(party.member3);
    return arr;
  }, [party]);

  // === 戦闘 actors (state) ===
  const [actors, setActors] = useState<ActorState[]>(() => {
    const allies = partyIds.map((id) => buildAllyActor(id, hero, jobs));
    const enemies = mapEnemies ?? buildEnemies(stage);
    return [...allies, ...enemies];
  });

  const [phase, setPhase] = useState<Phase>("selecting");
  const [activeAllyIdx, setActiveAllyIdx] = useState(0);
  const [pendingActions, setPendingActions] = useState<QueuedAction[]>([]);
  const [pickingTargetFor, setPickingTargetFor] = useState<{
    type: "attack" | "skill";
    skill?: Skill;
  } | null>(null);
  const [pickingAllyTargetFor, setPickingAllyTargetFor] = useState<Skill | null>(null);
  const [showingSkillsFor, setShowingSkillsFor] = useState<string | null>(null);
  const [logLines, setLogLines] = useState<string[]>(["まものが あらわれた！"]);
  const [popups, setPopups] = useState<PendingPopup[]>([]);
  const popupId = useRef(0);
  const [flashId, setFlashId] = useState<string | null>(null);
  const finishedRef = useRef(false);
  const [canSkipResult, setCanSkipResult] = useState(false);
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null);
  // レベルアップ派手演出 (Phase 2d-3)
  const [levelUpEffect, setLevelUpEffect] = useState<{ visible: boolean; color: string; charName: string } | null>(null);
  const [allyImgErrors, setAllyImgErrors] = useState<Record<string, boolean>>({});
  const handleAllyImgError = (actorId: string): void => {
    setAllyImgErrors((prev) => ({ ...prev, [actorId]: true }));
  };

  useEffect(() => {
    playBGM("battle");
    return () => {
      stopBGM();
    };
  }, []);

  const allies = actors.filter((a) => a.side === "ally");
  const enemies = actors.filter((a) => a.side === "enemy");
  const liveAlly = liveAllies(actors);
  const liveEnemy = liveEnemies(actors);

  // 現在コマンド選択中の味方
  const currentAlly = liveAlly[activeAllyIdx];

  const pushLog = (lines: string[]): void => {
    setLogLines((prev) => [...lines, ...prev].slice(0, 6));
  };

  const spawnPopups = (
    raw: Array<{ actorId: string; value: number; kind: "damage" | "heal" | "miss" | "crit" }>
  ): void => {
    const items: PendingPopup[] = raw.map((p) => ({
      id: popupId.current++,
      ...p
    }));
    setPopups((prev) => [...prev, ...items]);
    items.forEach((item) => {
      setTimeout(() => {
        setPopups((prev) => prev.filter((p) => p.id !== item.id));
      }, 900);
    });
  };

  const triggerFlash = (actorId: string): void => {
    setFlashId(actorId);
    setTimeout(() => setFlashId((cur) => (cur === actorId ? null : cur)), 280);
  };

  // レベルアップ演出トリガー: リーダー(hero)のテーマカラーで発火 (Phase 2d-3)
  const triggerLevelUpEffect = (): void => {
    const leaderColor = MEMBER_COLORS["hero"];
    const leaderName = hero.name || "しゅじんこう";
    setLevelUpEffect({ visible: true, color: leaderColor, charName: leaderName });
    setTimeout(() => setLevelUpEffect(null), 2000);
  };

  // === コマンド選択ハンドラ ===
  const handleAttackButton = (): void => {
    if (liveEnemy.length === 1) {
      enqueueAttack(liveEnemy[0]);
    } else {
      setPickingTargetFor({ type: "attack" });
    }
  };

  const enqueueAttack = (target: ActorState): void => {
    const action: QueuedAction = {
      actor: currentAlly,
      type: "attack",
      targets: [target]
    };
    advanceAfterEnqueue(action);
  };

  const handleSkillButton = (): void => {
    setShowingSkillsFor(currentAlly.id);
  };

  const handlePickSkill = (skill: Skill): void => {
    if (!canUseSkill(currentAlly, skill)) return;
    setShowingSkillsFor(null);

    if (skill.target === "self") {
      enqueueSkill(skill, [currentAlly]);
    } else if (skill.target === "enemyAll") {
      enqueueSkill(skill, liveEnemy);
    } else if (skill.target === "allyAll") {
      enqueueSkill(skill, liveAlly);
    } else if (skill.target === "enemySingle") {
      if (liveEnemy.length === 1) {
        enqueueSkill(skill, [liveEnemy[0]]);
      } else {
        setPickingTargetFor({ type: "skill", skill });
      }
    } else if (skill.target === "allySingle") {
      // 蘇生は戦闘不能を、回復は生存を選ぶ
      setPickingAllyTargetFor(skill);
    }
  };

  const enqueueSkill = (skill: Skill, targets: ActorState[]): void => {
    const action: QueuedAction = {
      actor: currentAlly,
      type: "skill",
      skill,
      targets
    };
    advanceAfterEnqueue(action);
  };

  const handleDefendButton = (): void => {
    advanceAfterEnqueue({ actor: currentAlly, type: "defend", targets: [currentAlly] });
  };

  const advanceAfterEnqueue = (action: QueuedAction): void => {
    setPendingActions((prev) => {
      const next = [...prev, action];
      const remaining = liveAlly.length - next.length;
      if (remaining > 0) {
        setActiveAllyIdx(next.length);
      } else {
        // 全員入力完了 → 実行へ
        setActiveAllyIdx(0);
        setPickingTargetFor(null);
        setPickingAllyTargetFor(null);
        setShowingSkillsFor(null);
        setTimeout(() => executeTurn(next), 100);
      }
      return next;
    });
  };

  const handlePickEnemyTarget = (target: ActorState): void => {
    if (!pickingTargetFor) return;
    if (pickingTargetFor.type === "attack") {
      enqueueAttack(target);
    } else if (pickingTargetFor.type === "skill" && pickingTargetFor.skill) {
      enqueueSkill(pickingTargetFor.skill, [target]);
    }
  };

  const handlePickAllyTarget = (target: ActorState): void => {
    if (!pickingAllyTargetFor) return;
    const skill = pickingAllyTargetFor;
    // 蘇生は戦闘不能のみ、回復は生存のみ
    if (skill.effect.reviveHpPercent && target.hp > 0) return;
    if (!skill.effect.reviveHpPercent && target.hp <= 0) return;
    enqueueSkill(skill, [target]);
  };

  // === ターン実行 ===
  const executeTurn = (actions: QueuedAction[]): void => {
    setPhase("executing");

    // 敵のアクションを生成 (生存している敵がランダムに生存している味方を殴る)
    const enemyActions: QueuedAction[] = liveEnemy.map((enemy) => ({
      actor: enemy,
      type: "attack",
      targets: [pickRandomLiveAlly()]
    }));

    const ordered = sortBySpeed([...actions, ...enemyActions]);

    runActionsSerial(ordered, 0);
  };

  const pickRandomLiveAlly = (): ActorState => {
    const alive = actors.filter((a) => a.side === "ally" && a.hp > 0);
    return alive[Math.floor(Math.random() * alive.length)];
  };

  const runActionsSerial = (queue: QueuedAction[], idx: number): void => {
    if (idx >= queue.length) {
      finishTurn();
      return;
    }

    const action = queue[idx];
    // 行動者がすでに戦闘不能ならスキップ
    if (action.actor.hp <= 0) {
      runActionsSerial(queue, idx + 1);
      return;
    }
    // 麻痺
    if (action.actor.paralyzed) {
      pushLog([`${action.actor.displayName} はまひしてうごけない！`]);
      action.actor.paralyzed = false;
      setTimeout(() => runActionsSerial(queue, idx + 1), 500);
      return;
    }

    // ターゲットを生存者に絞り直す (途中で倒れた可能性)
    const validTargets = action.targets.filter((t) => {
      if (action.skill?.effect.reviveHpPercent) return t.hp === 0;
      return t.hp > 0 || t === action.actor;
    });

    let result;
    if (action.type === "attack") {
      const target = validTargets[0] ?? (action.actor.side === "ally" ? liveEnemy[0] : liveAlly[0]);
      if (!target) {
        runActionsSerial(queue, idx + 1);
        return;
      }
      result = performBasicAttack(action.actor, target);
      playSE(action.actor.side === "ally" ? "attack" : "damage");
      triggerFlash(target.id);
    } else if (action.type === "defend") {
      result = applyDefend(action.actor);
    } else if (action.type === "skill" && action.skill) {
      // コスト消費
      const ok = consumeSkillCost(action.actor, action.skill);
      if (!ok) {
        pushLog([`${action.actor.displayName} はちからつき…`]);
        runActionsSerial(queue, idx + 1);
        return;
      }
      const allAllies = actors.filter((a) => a.side === "ally");
      result = applySkill(action.actor, action.skill, validTargets, allAllies);
      playSE("attack");
      validTargets.forEach((t) => triggerFlash(t.id));
    } else {
      result = { log: [], popups: [] };
    }

    pushLog(result.log);
    spawnPopups(result.popups);

    // 状態を再描画
    setActors([...actors]);

    // 勝敗判定
    if (liveEnemies(actors).length === 0) {
      setTimeout(() => endStage("victory"), 600);
      return;
    }
    if (liveAllies(actors).length === 0) {
      setTimeout(() => endStage("defeat"), 600);
      return;
    }

    setTimeout(() => runActionsSerial(queue, idx + 1), 450);
  };

  const finishTurn = (): void => {
    // バフ・状態の経過処理
    actors.forEach((a) => {
      if (a.attackBuff) {
        a.attackBuff.turnsRemaining -= 1;
        if (a.attackBuff.turnsRemaining <= 0) a.attackBuff = undefined;
      }
      a.defenseBuffPct = undefined;
    });

    // 主人公パッシブ「ルメナリス」
    const heroActor = actors.find((a) => a.memberId === "hero" && a.side === "ally") ?? null;
    const liveAllyArr = actors.filter((a) => a.side === "ally" && a.hp > 0);
    const passive = tryLumenaris(heroActor, liveAllyArr);
    if (passive.triggered) {
      pushLog(passive.log);
      spawnPopups(passive.popups);
      playSE("levelup");
    }

    setActors([...actors]);

    if (liveEnemies(actors).length === 0) {
      endStage("victory");
      return;
    }
    if (liveAllies(actors).length === 0) {
      endStage("defeat");
      return;
    }

    // 次ターンへ
    setPendingActions([]);
    setActiveAllyIdx(0);
    setPhase("selecting");
  };

  const endStage = (outcome: "victory" | "defeat"): void => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setPhase(outcome === "victory" ? "stageClear" : "defeated");

    setTimeout(() => {
      setCanSkipResult(true);
    }, 800);

    if (outcome === "victory") {
      playSE("victory");
      playSE("levelup");
      // フルスクリーン光線エフェクト発火 (Phase 2d-3)
      triggerLevelUpEffect();
    } else {
      playSE("damage");
    }

    // 経験値配分: 敵総EXP = enemies の合計 (level*15)
    const enemiesAll = actors.filter((a) => a.side === "enemy");
    const totalExp = enemiesAll.reduce((s, e) => s + e.level * 15, 0);
    const partyCount = allies.length;
    const expGain = outcome === "victory" ? Math.floor(totalExp / partyCount) : 0;

    const allyFinal: BattleResult["allyFinal"] = allies.map((a) => ({
      memberId: a.memberId!,
      hp: a.hp,
      maxHp: a.maxHp,
      mp: a.mp,
      maxMp: a.maxMp
    }));

    setBattleResult({ outcome, expGain, allyFinal });
  };

  const handleBack = (): void => {
    if (phase === "executing") return;
    playSE("cancel");
    back();
  };

  const handleResultNext = (): void => {
    if (!canSkipResult || !battleResult) return;
    onFinish(battleResult);
  };

  // === 描画 ===
  const inputDisabled = phase !== "selecting" || !currentAlly;

  const stageBgUrl = STAGE_BG_URLS[((stage - 1) % 6) + 1];

  return (
    <div
      className="card screen battleScreenWide"
      style={stageBgUrl ? { backgroundImage: `url(${stageBgUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
    >
      <h2>バトル {stage}</h2>

      {phase === "selecting" && currentAlly && (
        <div className="battleTurnBanner">
          {currentAlly.displayName} のターン
        </div>
      )}
      {phase === "executing" && (
        <div className="battleTurnBanner battleTurnBanner--executing">
          実行!
        </div>
      )}

      {/* 敵エリア */}
      <div className="battleEnemiesRow">
        {enemies.map((e) => {
          const dead = e.hp <= 0;
          const targeting = pickingTargetFor && !dead;
          return (
            <button
              key={e.id}
              type="button"
              className={`battleEnemy ${dead ? "battleEnemy--dead" : ""} ${flashId === e.id ? "flash" : ""} ${targeting ? "battleEnemy--targetable" : ""}`}
              onClick={() => targeting && handlePickEnemyTarget(e)}
              disabled={!targeting}
            >
              <div className="battleEmoji">{e.emoji}</div>
              <div className="battleName">{e.displayName}</div>
              <div className="battleHpBar">
                <div
                  className="battleHpFill battleHpFill--enemy"
                  style={{ width: `${(e.hp / e.maxHp) * 100}%` }}
                />
              </div>
              <div className="battleHpText">{e.hp}/{e.maxHp}</div>
              <div className="popupLayer">
                {popups.filter((p) => p.actorId === e.id).map((p) => (
                  <span key={p.id} className={`damagePopup ${p.kind === "crit" ? "critical" : ""}`}>
                    {p.value}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {/* 味方エリア */}
      <div className="battleAlliesRow">
        {allies.map((a, idx) => {
          const dead = a.hp <= 0;
          const isCurrent = phase === "selecting" && currentAlly && a.id === currentAlly.id;
          const allyTargeting = pickingAllyTargetFor && (
            (pickingAllyTargetFor.effect.reviveHpPercent && dead) ||
            (!pickingAllyTargetFor.effect.reviveHpPercent && !dead)
          );
          return (
            <button
              key={a.id}
              type="button"
              className={`battleAlly ${dead ? "battleAlly--dead" : ""} ${isCurrent ? "battleAlly--active" : ""} ${flashId === a.id ? "flash" : ""} ${allyTargeting ? "battleAlly--targetable" : ""}`}
              onClick={() => allyTargeting && handlePickAllyTarget(a)}
              disabled={!allyTargeting}
            >
              {a.memberId && memberSpriteUrl(a.memberId) && !allyImgErrors[a.id] ? (
                <img
                  src={memberSpriteUrl(a.memberId)!}
                  alt={a.displayName}
                  className="battleAllySprite"
                  onError={() => handleAllyImgError(a.id)}
                />
              ) : (
                <div className="battleEmoji">{a.emoji}</div>
              )}
              <div className="battleName">
                {a.displayName} <span className="lvInline">Lv.{a.level}</span>
              </div>
              <div className="battleHpBar">
                <div className="battleHpFill" style={{ width: `${(a.hp / a.maxHp) * 100}%` }} />
              </div>
              <div className="battleHpText">{a.hp}/{a.maxHp}{typeof a.mp === "number" ? ` MP${a.mp}/${a.maxMp}` : ""}</div>
              <div className="popupLayer">
                {popups.filter((p) => p.actorId === a.id).map((p) => (
                  <span
                    key={p.id}
                    className={`damagePopup ${p.kind === "heal" ? "healPopup" : ""} ${p.kind === "crit" ? "critical" : ""}`}
                  >
                    {p.kind === "heal" ? `+${p.value}` : p.value}
                  </span>
                ))}
              </div>
              {idx + 1 <= pendingActions.length && (
                <span className="battleQueuedBadge">✓ 決定済</span>
              )}
            </button>
          );
        })}
      </div>

      {/* ログ */}
      <div className="battleLog">
        {logLines.slice(0, 3).map((l, i) => (
          <p key={i} className={i === 0 ? "battleLogLatest" : ""}>{l}</p>
        ))}
      </div>

      {/* コマンド入力 */}
      {phase === "selecting" && currentAlly && !showingSkillsFor && !pickingTargetFor && !pickingAllyTargetFor && (
        <div className="battleCommands">
          <p className="battleTurnIndicator">
            {currentAlly.displayName} のコマンドをえらんでください
          </p>
          <button onClick={handleAttackButton} disabled={inputDisabled}>たたかう</button>
          <button onClick={handleSkillButton} disabled={inputDisabled || unlockedSkills(currentAlly.memberId!, currentAlly.level).length === 0}>ひっさつ</button>
          <button onClick={handleDefendButton} disabled={inputDisabled}>ぼうぎょ</button>
        </div>
      )}

      {/* 必殺技リスト */}
      {showingSkillsFor && currentAlly && (
        <div className="battleCommands">
          <p>{currentAlly.displayName} のひっさつ</p>
          {unlockedSkills(currentAlly.memberId!, currentAlly.level).map((s) => {
            const usable = canUseSkill(currentAlly, s);
            const cost = s.costType === "hpPercent"
              ? `HP-${Math.floor(currentAlly.maxHp * s.costValue / 100)}`
              : `MP${s.costValue}`;
            return (
              <button
                key={s.id}
                onClick={() => handlePickSkill(s)}
                disabled={!usable}
                title={s.description}
              >
                {s.name} <small>({cost})</small>
              </button>
            );
          })}
          <button onClick={() => setShowingSkillsFor(null)}>もどる</button>
        </div>
      )}

      {/* ターゲット選択中の案内 */}
      {pickingTargetFor && (
        <div className="battleCommands">
          <p>てきをえらんでください</p>
          <button onClick={() => setPickingTargetFor(null)}>キャンセル</button>
        </div>
      )}
      {pickingAllyTargetFor && (
        <div className="battleCommands">
          <p>{pickingAllyTargetFor.effect.reviveHpPercent ? "そせいするなかまをえらんでね" : "なかまをえらんでください"}</p>
          <button onClick={() => setPickingAllyTargetFor(null)}>キャンセル</button>
        </div>
      )}

      {phase !== "stageClear" && phase !== "defeated" && (
        <button onClick={handleBack} disabled={phase === "executing"}>もどる</button>
      )}

      {phase === "stageClear" && (
        <>
          <div className="stageClearOverlay" />
          <div className="stageClearText">ステージクリア！</div>
          <button className="stageClearSkip" onClick={handleResultNext} disabled={!canSkipResult}>次へ</button>
        </>
      )}
      {phase === "defeated" && (
        <>
          <div className="stageClearOverlay" />
          <div className="stageClearText" style={{ color: "#ff4444", textShadow: "0 0 8px #800" }}>
            ぜんめつ…
          </div>
          <button className="stageClearSkip" onClick={handleResultNext} disabled={!canSkipResult}>もどる</button>
        </>
      )}

      {/* レベルアップ派手演出オーバーレイ (Phase 2d-3) */}
      {levelUpEffect && (
        <>
          <div className="levelUpOverlay" />
          <div className="levelUpText" style={{ color: levelUpEffect.color }}>
            Lv UP!
          </div>
        </>
      )}
    </div>
  );
}
