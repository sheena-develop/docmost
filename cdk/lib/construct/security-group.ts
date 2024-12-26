import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

interface SecurityGroupProps {
  vpc: ec2.Vpc;
  resourceName: string;
}

export class SecurityGroup extends Construct {
  public readonly albSecurityGroup: ec2.SecurityGroup;
  public readonly ecsSecurityGroup: ec2.SecurityGroup;
  public readonly redisSecurityGroup: ec2.SecurityGroup;
  public readonly rdsSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: SecurityGroupProps) {
    super(scope, id);

    /**
     * ALB に関連付けるセキュリティグループを作成する
     * - インバウンド通信: IPv4 アドレスからの HTTPS アクセスを許可
     * - アウトバウンド通信: ECS(ポート: 3000) のみ許可
     */
    this.albSecurityGroup = new ec2.SecurityGroup(this, 'AlbSecurityGroup', {
      securityGroupName: `${props.resourceName}-alb-sg`,
      vpc: props.vpc,
      description: 'Allow HTTPS inbound traffic. Allow outbound traffic to ECS tasks on port 3000.',
      allowAllOutbound: false
    });

    /**
     * ECS に関連付けるセキュリティグループを作成する
     * - インバウンド通信: ALB(ポート: 3000) からの HTTP アクセスを許可
     * - アウトバウンド通信: Redis(ポート: 6379), RDS(ポート: 5432), IPv4 アドレスからの HTTPS アクセスを許可
     */
    this.ecsSecurityGroup = new ec2.SecurityGroup(this, 'EcsSecurityGroup', {
      securityGroupName: `${props.resourceName}-ecs-sg`,
      vpc: props.vpc,
      description: 'Allow HTTP inbound from ALB, Allow outbound to Redis on port 6379, Allow outbound to RDS on port 5432.',
      allowAllOutbound: false
    });

    /**
     * Redis に関連付けるセキュリティグループを作成する
     * - インバウンド通信: ECSからの Redis(ポート: 6379) アクセスを許可
     * - アウトバウンド通信: すべて許可しない
     */
    this.redisSecurityGroup = new ec2.SecurityGroup(this, 'RedisSecurityGroup', {
      securityGroupName: `${props.resourceName}-redis-sg`,
      vpc: props.vpc,
      description: 'Allow Redis inbound from ECS, restrict outbound traffic.',
      allowAllOutbound: false
    });

    /**
     * RDS に関連付けるセキュリティグループを作成する
     * - インバウンド通信: ECSからの PostgreSQL(ポート: 5432) アクセスを許可
     * - アウトバウンド通信: すべて許可しない
     */
    this.rdsSecurityGroup = new ec2.SecurityGroup(this, 'RdsSecurityGroup', {
      securityGroupName: `${props.resourceName}-rds-sg`,
      vpc: props.vpc,
      description: 'Allow PostgreSQL inbound from ECS, restrict outbound traffic.',
      allowAllOutbound: false
    });

    // ALB
    this.albSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), 'Allow HTTPS inbound traffic');
    this.albSecurityGroup.addEgressRule(this.ecsSecurityGroup, ec2.Port.tcp(3000), 'Allow outbound traffic to ECS tasks on port 3000');

    // ECS
    this.ecsSecurityGroup.addIngressRule(this.albSecurityGroup, ec2.Port.tcp(3000), 'Allow inbound from ALB on port 3000');
    this.ecsSecurityGroup.addEgressRule(this.redisSecurityGroup, ec2.Port.tcp(6379), 'Allow outbound to Redis on port 6379');
    this.ecsSecurityGroup.addEgressRule(this.rdsSecurityGroup, ec2.Port.tcp(5432), 'Allow outbound to RDS on port 5432');
    this.ecsSecurityGroup.addEgressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), 'Allow outbound HTTPS to internet');

    // Redis
    this.redisSecurityGroup.addIngressRule(this.ecsSecurityGroup, ec2.Port.tcp(6379), 'Allow inbound Redis traffic from ECS');

    // RDS
    this.rdsSecurityGroup.addIngressRule(this.ecsSecurityGroup, ec2.Port.tcp(5432), 'Allow inbound PostgreSQL from ECS');
  }
}
