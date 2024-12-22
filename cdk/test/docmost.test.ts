import * as cdk from 'aws-cdk-lib';
import * as dotenv from 'dotenv';
import { Template } from 'aws-cdk-lib/assertions';
import { DocmostStack } from '../lib/docmost-stack';

describe('Snapshot testing', () => {
  test('Snapshot testing for DocmostStack', () => {
    dotenv.config({ path: '.env' });

    const accountId = process.env.CDK_DEFAULT_ACCOUNT;
    const region = process.env.CDK_DEFAULT_REGION;
    const dockerImage = process.env.DOCKER_IMAGE;
    const appUrl = process.env.APP_URL;
    const appSecret = process.env.APP_SECRET;
    const rdsSecretManagerArn = process.env.RDS_SECRET_MANAGER_ARN;
    const redisEndpoint = process.env.REDIS_ENDPOINT;
    const certificateArn = process.env.CERTIFICATE_ARN;

    if (!accountId || !region || !dockerImage || !appUrl || !appSecret || !certificateArn) {
      throw new Error('Environmental variables are not set properly');
    }

    const app = new cdk.App();
    const stack = new DocmostStack(app, 'DocmostStack', {
      env: { account: accountId, region },
      dockerImage, appUrl, appSecret, rdsSecretManagerArn, redisEndpoint, certificateArn
    });

    expect(Template.fromStack(stack).toJSON()).toMatchSnapshot();
  });
});
