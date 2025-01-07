## デプロイ手順

### 前提条件
* ドメインが取得済みであること
* cdk bootstrap済みであること

1. .envの作成
```bash
cp .env.example .env
```

2. .envの入力
   1. ACCOUNT_ID
      1. e.g. 012345678910
   2. AWS_PROFILE
      1. e.g. XXX
   3. APP_URL
      1. e.g. https://example.com
   4. APP_SECRET
      1. `openssl rand -hex 32`で生成される値を使用する
      2. e.g. 01234565789abcdefghijklmnopqrstuvwxyz0123456789abcdefghijklmnopq
   5. DOMAIN_NAME
      1. e.g. example.com

3. `npm ci`
4. 初回は、`sh ecr-init.sh`を使用。2回目以降は、`sh ecr-push.sh`を使用
5. `npx cdk deploy --profile XXX`
   1. ※--profile XXX プロファイルを設定している場合のみ
6. コンソール画面で、作成されたRoute53のホストゾーンの4つのネームサーバーを含んだレコードがあるので、コピーして、ドメインを管理しているサービスに追加
7. デプロイが完了し、ドメインにアクセスできれば完了

## コマンド一覧

* `npm run build`   TypeScriptのコンパイル
* `npm run watch`   ホットリロードを使用したテスト(Jest)
* `npm run test`    テスト(Jest)
* `npx cdk deploy`  デプロイ
* `npx cdk diff`    差分の確認
* `npx cdk synth`   CFnの生成
* `npx cdk destroy` スタックの削除
* タスク一覧の取得
  * ※--profile XXX プロファイルを設定している場合のみ
```bash
aws ecs list-tasks --cluster docmost-cluster --profile XXX
```
* コンテナの中に入る
  * ※--profile XXX プロファイルを設定している場合のみ
```bash
aws ecs execute-command \
    --cluster docmost-cluster \
    --task <Task ARN> \
    --container EcsContainer \
    --interactive \
    --command "/bin/sh" \
    --profile XXX
```