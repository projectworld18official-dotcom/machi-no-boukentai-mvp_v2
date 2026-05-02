import { useState } from "react";
import { playSE, unlockAudio } from "../utils/audio";

interface Props {
  onConfirm: (name: string) => void;
}

// Phase 2d-2: 文字種制限撤廃 (1-4文字、Unicode 対応)
const isValidHeroName = (s: string): boolean => {
  const len = [...s].length; // サロゲートペア対応
  return len >= 1 && len <= 4;
};

export default function HeroNameModal({ onConfirm }: Props) {
  const [value, setValue] = useState("");
  const [touched, setTouched] = useState(false);

  const valid = isValidHeroName(value);
  const showError = touched && !valid && value.length > 0;

  const submit = async (): Promise<void> => {
    setTouched(true);
    if (!valid) return;
    await unlockAudio();
    playSE("decision");
    onConfirm(value);
  };

  return (
    <div className="heroNameOverlay">
      <div className="heroNameBox">
        <h2>しゅじんこうのなまえ</h2>
        <p className="heroNameHelp">1〜4もじでなまえをつけてね</p>
        <input
          className="heroNameInput"
          type="text"
          value={value}
          maxLength={4}
          placeholder=""
          onChange={(e) => setValue(e.target.value)}
          onBlur={() => setTouched(true)}
          autoFocus
          inputMode="text"
        />
        {showError && (
          <p className="heroNameError">1〜4もじでなまえをつけてね</p>
        )}
        <button onClick={submit} disabled={!valid}>
          けってい
        </button>
      </div>
    </div>
  );
}
