import { Construct } from 'constructs';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

interface EcsProps {
  vpc: ec2.Vpc;
  resourceName: string;
  ecrRepository: string;
  securityGroup: ec2.SecurityGroup;
  subnets: ec2.SubnetSelection;
  env: {
    APP_URL: string,
    APP_SECRET: string,
    DATABASE_URL: string,
    REDIS_URL: string
  };
}

export class Ecs extends Construct {
  public readonly fargateService: ecs.FargateService;

  constructor(scope: Construct, id: string, props: EcsProps) {
    super(scope, id);

    // NOTE: クラスターの作成
    const cluster = new ecs.Cluster(this, 'EcsCluster', {
      clusterName: `${props.resourceName}-cluster`,
      vpc: props.vpc
    });

    // NOTE: タスク定義の作成
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'EcsTaskDefinition', {
      cpu: 256,
      memoryLimitMiB: 512,
      runtimePlatform: {
        cpuArchitecture: ecs.CpuArchitecture.ARM64
      }
    });

    const logDriver = new ecs.AwsLogDriver({
      streamPrefix: 'ecs-fargate',
      logRetention: logs.RetentionDays.ONE_DAY
    });
    taskDefinition.addContainer('EcsContainer', {
      image: ecs.ContainerImage.fromRegistry(props.ecrRepository),
      portMappings: [{ containerPort: 3000, hostPort: 3000 }],
      environment: {
        DATABASE_URL: props.env.DATABASE_URL,
        APP_URL: props.env.APP_URL,
        APP_SECRET: props.env.APP_SECRET,
        REDIS_URL: props.env.REDIS_URL
      },
      logging: logDriver
    });

    // NOTE: Fargate起動タイプでサービスの作成
    this.fargateService = new ecs.FargateService(this, 'EcsFargateService', {
      cluster,
      taskDefinition,
      desiredCount: 2,
      securityGroups: [props.securityGroup],
      vpcSubnets: props.subnets,
      taskDefinitionRevision: ecs.TaskDefinitionRevision.LATEST
    });
  }
}
