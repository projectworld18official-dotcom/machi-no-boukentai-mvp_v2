import type { JobId, JobsState, PartyState } from "../types";
import { jobsMaster } from "../data/jobs";
import { playSE } from "../utils/audio";

interface Props {
  jobs: JobsState;
  party: PartyState;
  heroName: string;
  onChange: (party: PartyState) => void;
  back: () => void;
}

const JOB_IDS: JobId[] = ["warrior", "monk", "mage", "youtuber"];

export default function PartySetupScreen({ jobs, party, heroName, onChange, back }: Props) {
  const setSlot = (slot: "member2" | "member3", id: JobId | null): void => {
    playSE("decision");
    // 重複防止: もう一方の slot と同じなら入れ替え
    const otherSlot = slot === "member2" ? "member3" : "member2";
    const next: PartyState = { ...party, [slot]: id };
    if (id !== null && next[otherSlot] === id) {
      next[otherSlot] = party[slot];
    }
    onChange(next);
  };

  const handleBack = (): void => {
    playSE("cancel");
    back();
  };

  const renderSlot = (slot: "member2" | "member3") => {
    const current = party[slot];
    return (
      <div className="partySlot">
        <p className="partySlotLabel">{slot === "member2" ? "2人目" : "3人目"}</p>
        <div className="partySlotRow">
          {JOB_IDS.map((id) => {
            const j = jobsMaster[id];
            const lv = jobs[id].level;
            const active = current === id;
            const otherSlot = slot === "member2" ? "member3" : "member2";
            const usedByOther = party[otherSlot] === id;
            return (
              <button
                key={id}
                type="button"
                className={`charCard ${active ? "charCard--active" : ""}`}
                style={{ background: usedByOther && !active ? "#aaa" : "#5b8def" }}
                onClick={() => setSlot(slot, active ? null : id)}
                disabled={usedByOther && !active}
              >
                <span className="lvBadge">Lv.{lv}</span>
                <div className="charCardEmoji">{j.emoji}</div>
                <div className="charCardName">{j.displayName}</div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="card screen">
      <h2>パーティ編成</h2>
      <p>主人公 <strong>{heroName || "しゅじんこう"}</strong> + 2人で出発するよ</p>

      <div className="partyHeroSlot">
        <span className="lvBadge" style={{ position: "static", marginRight: 6 }}>主人公</span>
        <span style={{ fontSize: 26 }}>🦸</span>
        <span style={{ marginLeft: 8 }}>{heroName || "しゅじんこう"}</span>
      </div>

      {renderSlot("member2")}
      {renderSlot("member3")}

      <button onClick={handleBack}>もどる</button>
    </div>
  );
}
