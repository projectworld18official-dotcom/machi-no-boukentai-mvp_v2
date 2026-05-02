# まちの冒険隊 MVP v2

スマホ向けミニRPG。React + TypeScript + Vite。

## 起動

```bash
npm install
npm run dev
```

## ビルド

```bash
npm run build
```

## デプロイ（Vercel）

```bash
npm i -g vercel
vercel login
vercel
```

## 機能

- 5キャラ（ヒナ★5 / ダイチ★5 / ソラ★4 / ユウ★4 / ミオ★3）
- ガチャ（単発30💎 / 10連300💎、10連は最後1体★4以上確定）
- バトル（先頭キャラがリーダー、必殺技演出あり）
- なかま図鑑
- localStorage 永続化（キー: `machi_no_boukentai_save_v2`）

## 確率

- ★5: 6%（ヒナ3%、ダイチ3%）
- ★4: 24%（ソラ12%、ユウ12%）
- ★3: 70%（ミオ70%）
