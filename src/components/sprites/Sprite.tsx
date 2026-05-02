import type { Character } from "../../types";

type SpriteState = "idle" | "attack";

interface Props {
  character: Character;
  state: SpriteState;
}

// Phase 2b スプライトコンポーネント。
// character.sprite が定義されていれば 2 フレーム sprite sheet (PNG) を CSS animation で再生、
// 未定義なら emoji を 2 フレーム CSS keyframe で動かす (待機=フワフワ, 攻撃=突進)。
export default function Sprite({ character, state }: Props) {
  if (character.sprite) {
    const cfg = character.sprite;
    const src = state === "idle" ? cfg.idleSrc : cfg.attackSrc;
    const duration = state === "idle" ? cfg.idleDuration : cfg.attackDuration;

    return (
      <div
        className={`spriteSheet sprite-${state}`}
        style={{
          width: cfg.frameWidth,
          height: cfg.frameHeight,
          backgroundImage: `url(${src})`,
          backgroundSize: `${cfg.frameWidth * cfg.frameCount}px ${cfg.frameHeight}px`,
          animation: `spriteFrames ${duration}ms steps(${cfg.frameCount}) infinite`
        }}
      />
    );
  }

  return (
    <div className={`emojiSprite emojiSprite--${state}`}>
      <span className="emojiSpriteGlyph">{character.emoji}</span>
    </div>
  );
}
