#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import * as dotenv from 'dotenv';
import { DocmostStack } from '../lib/docmost-stack';

dotenv.config({ path: '.env' });

const accountId = process.env.CDK_DEFAULT_ACCOUNT;
const region = process.env.CDK_DEFAULT_REGION;
const domainName = process.env.DOMAIN_NAME;
const appUrl = process.env.APP_URL;
const appSecret = process.env.APP_SECRET;

if (!accountId || !region || !domainName || !appUrl || !appSecret) {
  throw new Error('Environmental variables are not set properly');
}

const env = {
  accountId: accountId,
  region: region,
  domainName: domainName,
  appUrl: appUrl,
  appSecret: appSecret
};

const app = new cdk.App();
new DocmostStack(app, 'DocmostStack', { ...env });
