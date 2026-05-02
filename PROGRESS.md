# Phase 2a 進捗ログ

**開始**: 2026-05-02
**指示書**: `C:\myapp\99_briefings\directive_phase_2a_20260502.md`
**プロジェクト**: machi-no-boukentai-mvp_v2

---

## Phase 2a-1: 計画 (in_progress → completed)

### 既存ファイル把握
- `src/App.tsx` — 4 画面の状態管理 (home/battle/gacha/collection)
- `src/components/HomeScreen.tsx` — 3 ボタン (バトル/ガチャ/なかま)
- `src/components/BattleScreen.tsx` — 通常/必殺攻撃、HP 管理、`flash` クラス使用
- `src/components/GachaScreen.tsx` — 単発/10連、結果表示 (`capsule rarity{n}`)
- `src/components/CollectionScreen.tsx` — 図鑑表示
- `src/data/characters.ts` — 5 体 (hina★5, sora★4, mio★3, yuu★4, daichi★5) **変更禁止**
- `src/data/gacha.ts` — 確率テーブル **変更禁止**
- `src/styles/app.css` — 既存 `.flash` boom keyframe 等あり
- `src/hooks/useGameState.ts` — localStorage 永続化
- `package.json` — react 19.2 + vite 8、追加依存は `tone` のみ

### 環境
- NTFY_TOPIC: 未設定 → 通知は失敗扱い、PROGRESS.md 記録のみで続行 (指示書許容)
- 作業ディレクトリ: `C:\myapp\machi-no-boukentai-mvp_v2`

### ファイル単位タスク分解

| Phase | 対象ファイル | 変更内容 |
|---|---|---|
| 2a-2 | `package.json`, `package-lock.json` | `npm install tone` |
| 2a-2 | `src/utils/audio.ts` (新規) | Tone.js で SE 6 + BGM 2 + unlock + API 4 関数 |
| 2a-2 | `src/components/HomeScreen.tsx` | 初回タップで `unlockAudio()` |
| 2a-3 | `src/components/BattleScreen.tsx` | ダメージ数字ポップアップ state、クリティカル 20% x1.5、SE 連動 |
| 2a-3 | `src/styles/app.css` | `.damagePopup`, `.critical` keyframes |
| 2a-4 | `src/components/GachaScreen.tsx` | レアリティ別エフェクト wrapper、SE 連動 |
| 2a-4 | `src/styles/app.css` | `.rarity5Effect` (虹), `.rarity4Effect` (金), `.rarity3Effect` (青) keyframes、ボタン hover/active、画面 fade-in |
| 2a-4 | 各 Screen コンポーネント | 画面 fade-in クラス付与 (`.app` ラッパまたは個別) |
| 2a-5 | `src/App.tsx` + `src/components/BattleScreen.tsx` | レベルアップ判定 (battleStage++ 時) → 中央表示 + SE |
| 2a-5 | `src/styles/app.css` | `.levelUpBanner` keyframe |

### 設計判断
- **音源**: Tone.js Synth/MembraneSynth/NoiseSynth/MetalSynth/PolySynth で軽量合成。BGM は Sequence/Loop で 4 小節
- **iOS unlock**: Tone は `Tone.start()` を user gesture 内で呼ぶ必要あり。`HomeScreen` 初回タップで unlock + 解錠フラグ
- **BGM 自動再生禁止**: unlock 後も明示的 `playBGM()` を呼ばないと鳴らない (指示書準拠)
- **クリティカル**: BattleScreen 内の通常/必殺の両方に適用
- **越境変更ガード**: characters.ts / gacha.ts / vercel.json / vite.config.ts / tsconfig.json は触らない

### 進行ルール
- 各 Phase 完了で git commit
- TS ビルドエラー 0 件を各 Phase 終端で確認
- 30 分以上同一エラーで詰まったら BLOCKED.md に記録 + 停止

