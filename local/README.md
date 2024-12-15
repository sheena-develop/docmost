# docmost local

.envの作成
```bash
cp .env.example .env
```

APP_SECRETの生成をして、`.env`の`APP_SECRET`に追記
```bash
openssl rand -hex 32
```

コンテナの起動
```bash
docker compose up -d
```

ボリュームも含めた、コンテナの削除
```bash
docker compose down -v
```
