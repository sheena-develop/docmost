import type { StackProps } from 'aws-cdk-lib';
import type { Construct } from 'constructs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ecrAssets from 'aws-cdk-lib/aws-ecr-assets';
import * as cdk from 'aws-cdk-lib';
import { Route53 } from './construct/route53';
import { Acm } from './construct/acm';
import { Vpc } from './construct/vpc';
import { SecurityGroup } from './construct/security-group';
import { Alb } from './construct/alb';
import { Redis } from './construct/redis';
import { Rds } from './construct/rds';
import { Ecs } from './construct/ecs';
import { SecretsManager } from './construct/secrets-manager';

interface DocmostStackProps extends StackProps {
  appUrl: string;
  appSecret: string;
  domainName: string;
  rdsCredentialsSecretArn: string | undefined;
}

export class DocmostStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: DocmostStackProps, readonly resourceName = 'docmost') {
    super(scope, id, props);

    // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-construct-library.html

    // ECR
    const repository = new ecr.Repository(this, 'EcrRepository', {
      repositoryName: resourceName,
    });

    // VPC
    const vpc = new Vpc(this, 'Vpc', resourceName);

    // Security Group
    const { albSecurityGroup, ecsSecurityGroup, redisSecurityGroup, rdsSecurityGroup } = new SecurityGroup(this, 'SecurityGroup', {
      vpc: vpc.value,
      resourceName
    });

    // HostZone
    const route53 = new Route53(this, 'Route53', {
      resourceName,
      domainName: props.domainName
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

    if (props.rdsCredentialsSecretArn) {

      // ECR IMAGE
      // new ecrAssets.DockerImageAsset(this, 'EcrImage', {
      //   directory: './src',
      //   assetName: resourceName
      // });

      // Secrets Manager
      const rdsSecretsManager = new SecretsManager(this, 'RdsSecretsManager');
      const { username, password, host, port, dbname } = rdsSecretsManager.getSecretValue(['username', 'password', 'host', 'port', 'dbname'], props.rdsCredentialsSecretArn);
      const databaseUrl = `postgresql://${username}:${password}@${host}:${port}/${dbname}?schema=public`;
      const redisUrl = `redis://${redis.value.attrEndpointAddress}:${redis.value.attrEndpointPort}`;

      // SSL Certificate Domain
      const acm = new Acm(this, 'Certificate', {
        resourceName,
        domainName: props.domainName,
        hostZone: route53.value
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
    }

    const hostedZoneNameServers = route53.value.hostedZoneNameServers;
    if (!hostedZoneNameServers) {
      throw new Error('hostedZoneNameServers for does not exist');
    }

    const nameServerList = cdk.Fn.join(',', hostedZoneNameServers);
    new cdk.CfnOutput(this, 'NameServerList', { value: nameServerList });
    new cdk.CfnOutput(this, 'RdsCredentialsSecretArn', { value: 'Please copy it from the AWS Management Console screen and store it in the .env file as RDS_CREDENTIALS_SECRET_ARN.' });
  }
}
