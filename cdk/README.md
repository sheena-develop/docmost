# Welcome to your CDK TypeScript project

This is a blank project for CDK development with TypeScript.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## 前提条件
* ドメインが取得済みであること
* AWS Certificate Manager で証明書を取得済みであること
* Route53でホストゾーンが作成され、ACMのCNAMEが追加済みであること
* ECRレジストリにDockerイメージがプッシュ済みであること

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `npx cdk bootstrap`
* `npx cdk deploy`  deploy this stack to your default AWS account/region
* `npx cdk diff`    compare deployed stack with current state
* `npx cdk synth`   emits the synthesized CloudFormation template
* `npx cdk destroy`
