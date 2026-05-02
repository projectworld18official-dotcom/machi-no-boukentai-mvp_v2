import { useState } from "react";
import { playSE, unlockAudio } from "../utils/audio";

interface Props {
  onConfirm: (name: string) => void;
}

const KATAKANA_1_TO_4 = /^[ァ-ヶー]{1,4}$/;

export default function HeroNameModal({ onConfirm }: Props) {
  const [value, setValue] = useState("");
  const [touched, setTouched] = useState(false);

  const valid = KATAKANA_1_TO_4.test(value);
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
        <p className="heroNameHelp">カタカナ1〜4もじでなまえをつけてね</p>
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
          <p className="heroNameError">カタカナ1〜4もじでなまえをつけてね</p>
        )}
        <button onClick={submit} disabled={!valid}>
          けってい
        </button>
      </div>
    </div>
  );
}
