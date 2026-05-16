# CLAUDE.md — プロジェクト絶対ルール

## ⛔ ブランチ操作 完全禁止

以下のコマンドは**いかなる理由があっても実行してはならない**：

- git checkout -b <任意のブランチ名>
- git switch -c <任意のブランチ名>
- git branch <新規ブランチ名>
- gh pr create

## ✅ 必須ワークフロー

作業開始時：
git checkout main && git pull origin main && git branch
（* main であることを確認してから作業開始）

作業完了時：
git add -A → git commit → git push origin main
PRは作成しない。必ず main に直接 push する。

## ⛔ 違反パターン一覧（すべて禁止）

- git checkout -b feature/xxx → 禁止
- git switch -c fix/xxx → 禁止
- gh pr create → 禁止
- detached HEAD 状態のまま push → 禁止（main に戻ってから実行）

## ⚠️ コンフリクト発生時

マージせず即座に停止し、司令官に報告する。

## 補足

このルールはすべての指示書に優先する。
