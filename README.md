# Docmost

## 概要
このプロジェクトは、AWS CDK を使って Docmost を構築するためのソースコードです。

### 環境構築

### コマンド

### srcについて
このプロジェクトでは、AWSで使う際に、一部OSSのソースコードを変更する必要があるため、[Docmost](https://github.com/docmost/docmost)をサブモジュールとして追加しています。

### フォルダ構成

```bash
.
├── cdk
│   └── ... # AWS CDK(v2)
├── local
│   └── ... # ローカル環境(Docker)
└── src
    └── ... # Docmost Repository
```

### プロジェクトの共同作業について

このプロジェクトは[GitHub Flow](https://docs.github.com/ja/get-started/using-github/github-flow)に従って、共同作業を行います。

### ブランチの規則

ブランチの一貫性と明確さを保つために、以下の規則を採用しています。

※xxxはIssueの番号を指します。
- feat/issue-xxx 機能追加等
- fix/issue-xxx バグ修正や機能改善等
- refactor/issue-xxx リファクタリング等
- ci/issue-xxx 環境構築に関わる追加や修正等
- chore/issue-xxx その他

### コミットメッセージの規則

コミットメッセージの一貫性と明確さを保つために、[Semantic Commit Message](https://sparkbox.com/foundry/semantic_commit_messages) の規則を採用しています

:wrench: chore: (タスクファイルなどプロダクションに影響のない修正、実稼働のコードの変更は含めない)

    🔧 chore: デバッグ用のログを削除

:memo: docs: (ドキュメントの更新)

    📝 docs: API の使用方法を README に追記

:sparkles: feat: (ユーザー向けの機能の追加や変更)

    ✨ feat: ユーザープロフィール画面の追加

:bug: fix: (ユーザー向けの不具合の修正)

    🐛 fix: ログイン時のエラーハンドリングを修正

:recycle: refactor: (リファクタリングを目的とした修正)

    ♻️ refactor: 変数名を明確にするためのリファクタリング

:art: style: (スタイルやセミコロンの欠落などの修正、実稼働のコードの変更は含めない)

    🎨 style: コードのインデントを修正

:microscope: test: (テストコードの追加や修正、実稼働のコードの変更は含めない)

    🔬 test: 新規登録機能のユニットテストを追加

:construction_worker: ci: (環境構築に関わる追加や修正)

    👷 ci: バージョン変更に伴う Dockerfile の修正
