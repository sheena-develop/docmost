# Welcome to your CDK TypeScript project

This is a blank project for CDK development with TypeScript.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## 前提条件
* ドメインが取得済みであること

1. .envの作成
```bash
cp .env.example .env
```

2. .envの入力
   1. CDK_DEFAULT_ACCOUNT
      1. e.g. 012345678910
   2. APP_URL
      1. e.g. https://example.com
   3. APP_SECRET
      1. `openssl rand -hex 32`で生成される値を使用する
      2. e.g. 01234565789abcdefghijklmnopqrstuvwxyz0123456789abcdefghijklmnopq
   4. DOMAIN_NAME
      1. e.g. example.com
   5. RDS_CREDENTIALS_SECRET_ARN
      1. e.g. arn:aws:secretsmanager:ap-northeast-1:012345678910:secret:/xxx/yyy/zzz


## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `npx cdk bootstrap`
* `npx cdk deploy`  deploy this stack to your default AWS account/region
* `npx cdk diff`    compare deployed stack with current state
* `npx cdk synth`   emits the synthesized CloudFormation template
* `npx cdk destroy`
