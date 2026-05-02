import { useEffect } from "react";
import { playSE } from "../utils/audio";

interface Props {
  amount: number;
  title?: string;
  subtitle?: string;
  onClaim: () => void;
}

export default function FirstLoginModal({
  amount,
  title = "はじまりのプレゼント!",
  subtitle = "ようこそ！",
  onClaim
}: Props) {
  useEffect(() => {
    playSE("levelup");
  }, []);

  const handleClaim = (): void => {
    playSE("decision");
    onClaim();
  };

  return (
    <div className="heroNameOverlay">
      <div className="heroNameBox firstLoginBox">
        <div style={{ fontSize: 48 }}>🎁</div>
        <h2>{title}</h2>
        <p className="firstLoginAmount">💎 {amount}</p>
        <p className="heroNameHelp">{subtitle}</p>
        <button onClick={handleClaim}>うけとる</button>
      </div>
    </div>
  );
}
