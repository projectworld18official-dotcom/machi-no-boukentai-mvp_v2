# まちの冒険隊 — Asset License

## ソースコード
本プロジェクトのソースコードは私的開発物。再頒布禁止。

## 採用素材

### スプライト / キャラクタービジュアル (Phase 2b)
**現状: 外部素材なし。Unicode 絵文字を CSS keyframe で 2 フレームアニメーション化して使用。**

- 絵文字レンダリング: 各実行環境のシステムフォント (例: Apple Color Emoji / Segoe UI Emoji / Noto Color Emoji)
- 著作権: 各 OS ベンダ (Apple Inc. / Microsoft Corporation / Google LLC) に帰属、システムフォントとして OS 配布規約に従って利用
- 本プロジェクト内では絵文字をスタイル付きで描画するのみで、フォントファイル自体を再頒布しない

将来 OpenGameArt.org / itch.io 等の CC0 / CC-BY ライセンス素材を `src/assets/sprites/<character_id>/` に追加した場合は、本ファイルに以下フォーマットで追記すること:

```
- character_id (例: hina)
  - source URL: https://...
  - license: CC0 / CC-BY 4.0 / CC-BY-SA 4.0
  - author: <name>
  - notes: <調達日 / 加工有無 / 元ファイルパス>
```

`Character.sprite?: SpriteConfig` で sprite 指定があるキャラはその PNG が使われ、未指定なら `Sprite.tsx` が emoji フォールバックを返す設計。

### BGM / SE
Tone.js (MIT License, https://github.com/Tonejs/Tone.js) によるリアルタイム合成。外部音源ファイルなし。

### ライブラリ依存
- React (MIT, Meta Platforms Inc.)
- Vite (MIT, VoidZero Inc. / Evan You)
- TypeScript (Apache-2.0, Microsoft Corporation)
- Tone.js (MIT, Yotam Mann)
