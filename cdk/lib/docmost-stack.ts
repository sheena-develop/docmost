import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecs_patterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as efs from 'aws-cdk-lib/aws-efs';
import * as iam from 'aws-cdk-lib/aws-iam';

export class DocmostStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-construct-library.html
    const docmostVpc = new ec2.Vpc(this, 'DocmostVpc', {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 2,
      natGateways: 1,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      natGatewaySubnets: {
        subnetGroupName: 'AlbSubnet'
      },
      subnetConfiguration: [
        {
          name: 'AlbSubnet',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24
        },
        {
          name: 'EcsSubnet',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24
        },
        {
          name: 'RedisSubnet',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24
        },
        {
          name: 'RdsSubnet',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24
        }
      ]
    });

    // クラスター
    const docmostCluster = new ecs.Cluster(this, 'DocmostCluster', {vpc: docmostVpc});

    // EFS
    const docmostEfsFileSystem = new efs.FileSystem(this, 'DocmostEfsFileSystem', {
      vpc: docmostVpc,
      encrypted: true,
      lifecyclePolicy: efs.LifecyclePolicy.AFTER_14_DAYS,
      performanceMode: efs.PerformanceMode.GENERAL_PURPOSE,
      throughputMode: efs.ThroughputMode.BURSTING
    });

    docmostEfsFileSystem.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: ['elasticfilesystem:ClientMount'],
        principals: [new iam.AnyPrincipal()],
        conditions: {
          Bool: {
            'elasticfilesystem:AccessedViaMountTarget': 'true'
          }
        }
      })
    )

    // タスク
    const docmostTaskDefinition = new ecs.FargateTaskDefinition(this, 'DocmostTaskDefinition', {
      memoryLimitMiB: 512,
      cpu: 256,
      volumes: [
        {
          name: 'docmost',
          efsVolumeConfiguration: {
            fileSystemId: docmostEfsFileSystem.fileSystemId
          }
        }
      ]
    });

    // コンテナ
    const docmostContainerDefinition = new ecs.ContainerDefinition(this, 'DocmostContainerDefinition', {
      image: ecs.ContainerImage.fromRegistry('docmost/docmost:0.6.2'),
      taskDefinition: docmostTaskDefinition
    });

    docmostContainerDefinition.addMountPoints({
      sourceVolume: 'docmost',
      containerPath: '/app/data/storage',
      readOnly: false
    });

    docmostContainerDefinition.addPortMappings({
      containerPort: 3000
    });

    // サービス
    const docmostFargateService = new ecs_patterns.ApplicationLoadBalancedFargateService(this, 'DocmostFargateService', {
      cluster: docmostCluster,
      taskDefinition: docmostTaskDefinition,
      desiredCount: 2
    });

    docmostFargateService.targetGroup.setAttribute('deregistration_delay.timeout_seconds', '30');

    // Allow access to EFS from Fargate ECS
    docmostEfsFileSystem.grantRootAccess(docmostFargateService.taskDefinition.taskRole.grantPrincipal);
    docmostEfsFileSystem.connections.allowDefaultPortFrom(docmostFargateService.service.connections);

    /*
    // VPC構成
    const vpc = new Vpc(this, 'DocmostVpc', {
      ipAddresses: cdk.aws_ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 2,
      subnetConfiguration: [
        { name: 'PublicSubnet', subnetType: SubnetType.PUBLIC, cidrMask: 24 },
        { name: 'EcsSubnet', subnetType: SubnetType.PRIVATE_WITH_EGRESS, cidrMask: 24 },
        { name: 'DataSubnetRedis', subnetType: SubnetType.PRIVATE_ISOLATED, cidrMask: 24 },
        { name: 'DataSubnetRds', subnetType: SubnetType.PRIVATE_ISOLATED, cidrMask: 24 },
      ],
    });

    const cluster = new Cluster(this, 'DocmostCluster', {
      vpc,
    });

    // セキュリティグループ
    const albSg = new SecurityGroup(this, 'AlbSecurityGroup', {
      vpc,
      allowAllOutbound: true,
      description: 'Security Group for ALB',
    });
    albSg.addIngressRule(Peer.anyIpv4(), Port.tcp(443), 'Allow HTTPS Traffic');

    const ecsSg = new SecurityGroup(this, 'EcsSecurityGroup', {
      vpc,
      allowAllOutbound: true,
      description: 'Security Group for ECS Tasks',
    });
    ecsSg.addIngressRule(albSg, Port.tcp(80), 'Allow ALB to reach ECS');

    const efsSg = new SecurityGroup(this, 'EfsSecurityGroup', {
      vpc,
      allowAllOutbound: true,
      description: 'Security Group for EFS',
    });
    efsSg.addIngressRule(ecsSg, Port.tcp(2049), 'Allow ECS to EFS');

    const rdsSg = new SecurityGroup(this, 'RdsSecurityGroup', {
      vpc,
      description: 'Security group for RDS',
    });
    rdsSg.addIngressRule(ecsSg, Port.tcp(5432), 'Allow ECS to RDS');

    const redisSg = new SecurityGroup(this, 'RedisSecurityGroup', {
      vpc,
      description: 'Security group for Redis(ElastiCache)',
    });
    redisSg.addIngressRule(ecsSg, Port.tcp(6379), 'Allow ECS to Redis');

    // EFS作成
    const fileSystem = new FileSystem(this, 'DocmostEfs', {
      vpc,
      securityGroup: efsSg,
      vpcSubnets: { subnetType: SubnetType.PRIVATE_WITH_EGRESS },
    });

    // EFS Access Pointの作成
    const accessPoint = fileSystem.addAccessPoint('EfsAccessPoint', {
      path: '/app-data',
      posixUser: {
        uid: '1000',
        gid: '1000',
      },
      createAcl: {
        ownerUid: '1000',
        ownerGid: '1000',
        permissions: '755',
      },
    });

    // シークレット参照
    const dbSecret = AwsSecret.fromSecretAttributes(this, 'DbSecret', {
      secretCompleteArn: 'arn:aws:secretsmanager:ap-northeast-1:481665121106:secret:my-db-secret-ELgm5x',
    });

    const redisAuthSecret = AwsSecret.fromSecretAttributes(this, 'RedisAuthSecret', {
      secretCompleteArn: 'arn:aws:secretsmanager:ap-northeast-1:481665121106:secret:my-redis-secret-KXwhgK',
    });

    // RDS
    const rdsSubnetGroup = new cdk.aws_rds.SubnetGroup(this, 'RdsSubnetGroup', {
      description: 'RDS subnet group',
      vpc,
      subnetGroupName: 'docmost-rds-subnet-group',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      vpcSubnets: {
        subnets: vpc.selectSubnets({ subnetGroupName: 'DataSubnetRds' }).subnets,
      },
    });

    const rdsInstance = new DatabaseInstance(this, 'DocmostRDS', {
      engine: DatabaseInstanceEngine.postgres({ version: PostgresEngineVersion.VER_16_6 }),
      vpc,
      credentials: Credentials.fromSecret(dbSecret),
      vpcSubnets: { subnetGroupName: 'DataSubnetRds' },
      securityGroups: [rdsSg],
      deletionProtection: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Redis
    const redisSubnetGroup = new CfnSubnetGroup(this, 'RedisSubnetGroup', {
      description: 'Subnet group for Redis',
      subnetIds: vpc.selectSubnets({ subnetGroupName: 'DataSubnetRedis' }).subnetIds,
      cacheSubnetGroupName: 'docmost-redis-subnet-group',
    });

    const redisAuthToken = redisAuthSecret.secretValueFromJson('password').unsafeUnwrap();

    const redisReplication = new CfnReplicationGroup(this, 'DocmostRedis', {
      replicationGroupId: 'docmost-redis',
      replicationGroupDescription: 'Docmost Redis cluster',
      engine: 'redis',
      cacheNodeType: 'cache.t3.micro',
      numNodeGroups: 1,
      replicasPerNodeGroup: 1,
      authToken: redisAuthToken,
      atRestEncryptionEnabled: true,
      transitEncryptionEnabled: true,
      cacheSubnetGroupName: redisSubnetGroup.cacheSubnetGroupName,
      securityGroupIds: [redisSg.securityGroupId],
    });
    redisReplication.addDependsOn(redisSubnetGroup);

    // ECSタスクロールを作成
    const ecsTaskRole = new iam.Role(this, 'EcsTaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      description: 'Role for ECS tasks to access EFS',
    });

    // EFSアクセス権限を追加
    ecsTaskRole.addToPolicy(new iam.PolicyStatement({
      actions: [
        "elasticfilesystem:ClientMount",
        "elasticfilesystem:ClientWrite",
        "elasticfilesystem:DescribeMountTargets"
      ],
      resources: [fileSystem.fileSystemArn],
    }));

    // ECSタスク定義
    const taskDefinition = new FargateTaskDefinition(this, 'DocmostTaskDef', {
      cpu: 1024,
      memoryLimitMiB: 1072,
      taskRole: ecsTaskRole, // IAMロールをアタッチ
    });

    const container = taskDefinition.addContainer('AppContainer', {
      image: ContainerImage.fromRegistry('docmost/docmost:0.6.2'),
      secrets: {
        DB_USER: Secret.fromSecretsManager(dbSecret, 'username'),
        DB_PASSWORD: Secret.fromSecretsManager(dbSecret, 'password'),
        REDIS_AUTH_TOKEN: Secret.fromSecretsManager(redisAuthSecret, 'password'),
      },
      environment: {
        // NODE_ENV: 'production',
        DATABASE_URL: `postgresql://${dbSecret.secretValueFromJson('username').unsafeUnwrap()}:${dbSecret.secretValueFromJson('password').unsafeUnwrap()}@${rdsInstance.dbInstanceEndpointAddress}:5432/your-database-name`,
        REDIS_URL: `redis://:${redisAuthSecret.secretValueFromJson('password').unsafeUnwrap()}@${redisReplication.attrPrimaryEndPointAddress}:6379`,
        APP_SECRET: 'your-app-secret-key' // 固定値またはSecrets Managerから取得
      },
      logging: new cdk.aws_ecs.AwsLogDriver({
        streamPrefix: 'docmost',
      }),
    });
    container.addPortMappings({ containerPort: 80 });

    // EFSマウント (Access Point利用)
    taskDefinition.addVolume({
      name: 'EfsVolume',
      efsVolumeConfiguration: {
        fileSystemId: fileSystem.fileSystemId,
        transitEncryption: 'ENABLED',
        authorizationConfig: {
          accessPointId: accessPoint.accessPointId,
          iam: 'ENABLED',
        },
      },
    });
    container.addMountPoints({
      sourceVolume: 'EfsVolume',
      containerPath: '/app/data/storage',
      readOnly: false,
    });

    // ECSサービス
    const ecsService = new FargateService(this, 'DocmostService', {
      cluster,
      taskDefinition,
      securityGroups: [ecsSg],
      vpcSubnets: { subnetGroupName: 'EcsSubnet' },
      desiredCount: 2,
    });

    // ALB
    const certificateArn = 'arn:aws:acm:ap-northeast-1:481665121106:certificate/9c6e668b-3080-48f0-8f5a-8b0e60ce09cb';
    const alb = new ApplicationLoadBalancer(this, 'DocmostAlb', {
      vpc,
      internetFacing: true,
      securityGroup: albSg,
      vpcSubnets: { subnetGroupName: 'PublicSubnet' },
    });

    const listener = alb.addListener('HttpsListener', {
      port: 443,
      certificates: [{ certificateArn }],
      defaultAction: ListenerAction.fixedResponse(404, {
        contentType: 'text/plain',
        messageBody: 'Service not available',
      }),
    });

    listener.addTargets('EcsTargets', {
      port: 80,
      targets: [ecsService],
      healthCheck: {
        path: '/',
        interval: cdk.Duration.seconds(30),
      },
    });

    new cdk.CfnOutput(this, 'AlbDnsName', {
      value: alb.loadBalancerDnsName,
      description: 'ALB DNS Name for external access',
    });
    */
  }
}
