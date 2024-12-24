#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import * as dotenv from 'dotenv';
import { DocmostStack } from '../lib/docmost-stack';

dotenv.config({ path: '.env' });

const accountId = process.env.CDK_DEFAULT_ACCOUNT;
const region = process.env.CDK_DEFAULT_REGION;
const appUrl = process.env.APP_URL;
const appSecret = process.env.APP_SECRET;
const domainName = process.env.DOMAIN_NAME;
const rdsCredentialsSecretArn = process.env.RDS_CREDENTIALS_SECRET_ARN;

if (!accountId || !region || !appUrl || !appSecret || !domainName || !rdsCredentialsSecretArn) {
  throw new Error('Environmental variables are not set properly');
}

const app = new cdk.App();
new DocmostStack(app, 'DocmostStack', {
  env: { account: accountId, region },
  appUrl, appSecret, domainName, rdsCredentialsSecretArn
});
