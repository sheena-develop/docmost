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
const mailDriver = process.env.MAIL_DRIVER;
const mailFromAddress = process.env.MAIL_FROM_ADDRESS;
const mailFromName = process.env.MAIL_FROM_NAME;
const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT;
const smtpUserName = process.env.SMTP_USERNAME;
const smtpPassword = process.env.SMTP_PASSWORD;
const smtpSecure = process.env.SMTP_SECURE;
const smtpIgnoretls = process.env.SMTP_IGNORETLS;


if (
  !accountId ||
  !region ||
  !domainName ||
  !appUrl ||
  !appSecret ||
  !mailDriver ||
  !mailFromAddress ||
  !mailFromName ||
  !smtpHost ||
  !smtpPort ||
  !smtpUserName ||
  !smtpPassword ||
  !smtpSecure ||
  !smtpIgnoretls
) {
  throw new Error('Environmental variables are not set properly');
}

const env = {
  accountId: accountId,
  region: region,
  domainName: domainName,
  appUrl: appUrl,
  appSecret: appSecret,
  mailDriver: mailDriver,
  mailFromAddress: mailFromAddress,
  mailFromName: mailFromName,
  smtpHost: smtpHost,
  smtpPort: smtpPort,
  smtpUserName: smtpUserName,
  smtpPassword: smtpPassword,
  smtpSecure: smtpSecure,
  smtpIgnoretls: smtpIgnoretls
};

const app = new cdk.App();
new DocmostStack(app, 'DocmostStack', { ...env });
