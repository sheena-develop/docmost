import type { StackProps } from 'aws-cdk-lib';
import type { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import { Vpc } from './construct/vpc';
import { SecurityGroup } from './construct/security-group';
import { Alb } from './construct/alb';
import { Redis } from './construct/redis';
import { Rds } from './construct/rds';
import { Ecs } from './construct/ecs';
import { SecretsManager } from './construct/secrets-manager';

interface DocmostStackProps extends StackProps {
  dockerImage: string;
  appUrl: string;
  appSecret: string;
  rdsSecretManagerArn: string | undefined;
  redisEndpoint: string | undefined;
  certificateArn: string;
}

export class DocmostStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: DocmostStackProps, readonly resourceName = 'docmost') {
    super(scope, id, props);

    // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-construct-library.html

    // VPC
    const vpc = new Vpc(this, 'Vpc', resourceName);

    // Security Group
    const { albSecurityGroup, ecsSecurityGroup, redisSecurityGroup, rdsSecurityGroup } = new SecurityGroup(this, 'SecurityGroup', {
      vpc: vpc.value,
      resourceName
    });

    // ALB
    const alb = new Alb(this, 'Alb', {
      vpc: vpc.value,
      resourceName,
      securityGroup: albSecurityGroup,
      subnets: vpc.getAlbPublicSubnets(),
      certificateArn: props.certificateArn
    });

    // Redis
    const redis = new Redis(this, 'Redis', {
      vpc: vpc.value,
      resourceName,
      securityGroup: redisSecurityGroup,
      subnets: vpc.getRedisPrivateIsolatedSubnets()
    });

    // RDS
    const rds = new Rds(this, 'Rds', {
      vpc: vpc.value,
      resourceName,
      securityGroup: rdsSecurityGroup,
      subnets: vpc.getRdsPrivateIsolatedSubnets()
    });

    // 初回、以下コメントアウト
    // /*
    if (!props.rdsSecretManagerArn) {
      throw new Error('Failed to get RDS_SECRET_MANAGER_ARN');
    }

    if (!props.redisEndpoint) {
      throw new Error('Failed to get REDIS ENDPOINT');
    }

    // Secrets Manager
    const secretsManager = new SecretsManager(this, 'SecretsManager');
    const keys: ['username', 'password', 'host', 'port', 'dbname'] = ['username', 'password', 'host', 'port', 'dbname'] as const;
    const { username, password, host, port, dbname } = secretsManager.getSecretValue(keys, props.rdsSecretManagerArn);
    const databaseUrl = `postgresql://${username}:${password}@${host}:${port}/${dbname}?schema=public&sslmode=require`;
    const redisUrl = `redis://${props.redisEndpoint}`;

    // ECS(Fargate)
    const ecs = new Ecs(this, 'EcsFargate', {
      vpc: vpc.value,
      resourceName,
      ecrRepository: props.dockerImage,
      securityGroup: ecsSecurityGroup,
      env: {
        APP_URL: props.appUrl,
        APP_SECRET: props.appSecret,
        DATABASE_URL: databaseUrl,
        REDIS_URL: redisUrl
      },
      subnets: vpc.getEcsPrivateWithEgressSubnets()
    });

    // NOTE: ターゲットグループにタスクを追加
    alb.addTargets('Ecs', {
      port: 3000,
      targets: [ecs.fargateService],
      healthCheck: {
        path: '/',
        interval: cdk.Duration.minutes(1)
      }
    });

    // NOTE: 出力としてロードバランサーのDNS名を出力
    new cdk.CfnOutput(this, 'LoadBalancerDns', {
      value: alb.value.loadBalancerDnsName
    });
    // */
  }
}
