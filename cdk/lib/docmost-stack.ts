import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import { Route53 } from './construct/route53';
import { Acm } from './construct/acm';
import { Vpc } from './construct/vpc';
import { SecurityGroup } from './construct/security-group';
import { Alb } from './construct/alb';
import { Redis } from './construct/redis';
import { Rds } from './construct/rds';
import { Ecs } from './construct/ecs';
import { SecretsManager } from './construct/secrets-manager';

interface DocmostStackProps extends cdk.StackProps {
  accountId: string;
  region: string;
  domainName: string;
  appUrl: string;
  appSecret: string;
  mailDriver: string;
  mailFromAddress: string;
  mailFromName: string;
  smtpHost: string;
  smtpPort: string;
  smtpUserName: string;
  smtpPassword: string;
  smtpSecure: string;
  smtpIgnoretls: string;
}

export class DocmostStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: DocmostStackProps, readonly resourceName = 'docmost') {
    super(scope, id, props);

    // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-construct-library.html

    // ECR
    const repository = ecr.Repository.fromRepositoryName(this, 'EcrRepository', resourceName);

    // HostZone
    const route53 = new Route53(this, 'Route53', {
      resourceName,
      domainName: props.domainName
    });

    // SSL Certificate Domain
    const acm = new Acm(this, 'Certificate', {
      resourceName,
      domainName: props.domainName,
      hostZone: route53.value
    });

    // VPC
    const vpc = new Vpc(this, 'Vpc', resourceName);
    vpc.node.addDependency(acm);

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
      certificateArn: acm.value.certificateArn
    });

    route53.addARecord('ARecord', {
      hostZone: route53.value,
      alb: alb.value,
      regionName: 'ap-northeast-1'
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

    // Secrets Manager
    const rdsSecretsManager = new SecretsManager(this, 'RdsSecretsManager');
    rdsSecretsManager.node.addDependency(rds.value);
    const { username, password, host, port, dbname } = rdsSecretsManager.getSecretValue(['username', 'password', 'host', 'port', 'dbname'], rds.value.secret!.secretArn);
    const databaseUrl = `postgresql://${username}:${password}@${host}:${port}/${dbname}?schema=public`;
    const redisUrl = `redis://${redis.value.attrEndpointAddress}:${redis.value.attrEndpointPort}`;

    // ECS(Fargate)
    const ecs = new Ecs(this, 'EcsFargate', {
      vpc: vpc.value,
      resourceName,
      ecrRepository: repository,
      securityGroup: ecsSecurityGroup,
      env: {
        APP_URL: props.appUrl,
        APP_SECRET: props.appSecret,
        DATABASE_URL: databaseUrl,
        REDIS_URL: redisUrl,
        MAIL_DRIVER: props.mailDriver,
        MAIL_FROM_ADDRESS: props.mailFromAddress,
        MAIL_FROM_NAME: props.mailFromName,
        SMTP_HOST: props.smtpHost,
        SMTP_PORT: props.smtpPort,
        SMTP_USERNAME: props.smtpUserName,
        SMTP_PASSWORD: props.smtpPassword,
        SMTP_SECURE: props.smtpSecure,
        SMTP_IGNORETLS: props.smtpIgnoretls
      },
      subnets: vpc.getEcsPrivateWithEgressSubnets()
    });
    ecs.node.addDependency(rdsSecretsManager);

    // NOTE: ターゲットグループにタスクを追加
    alb.addTargets('Ecs', {
      port: 3000,
      targets: [ecs.fargateService],
      healthCheck: {
        path: '/',
        interval: cdk.Duration.minutes(1)
      }
    });
  }
}
