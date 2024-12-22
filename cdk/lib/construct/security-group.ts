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

    this.albSecurityGroup = this.createAlbSecurityGroup(props.vpc, props.resourceName);
    this.ecsSecurityGroup = this.createEcsSecurityGroup(props.vpc, props.resourceName);
    this.redisSecurityGroup = this.createRedisSecurityGroup(props.vpc, props.resourceName);
    this.rdsSecurityGroup = this.createRdsSecurityGroup(props.vpc, props.resourceName);
  }

  /**
   * ALB に関連付けるセキュリティグループを作成する
   * - インバウンド通信: 任意の IPv4 アドレスからの HTTPS アクセスを許可
   * - アウトバウンド通信: すべて許可
   */
  private createAlbSecurityGroup(vpc: ec2.Vpc, resourceName: string): ec2.SecurityGroup {
    const sg = new ec2.SecurityGroup(this, 'AlbSecurityGroup', {
      securityGroupName: `${resourceName}-alb-sg`,
      vpc,
      description: 'Allow HTTP and HTTPS inbound traffic. Allow all outbound traffic.',
      allowAllOutbound: true
    });
    sg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), 'Allow HTTPS inbound traffic');

    return sg;
  }

  /**
   * ECS に関連付けるセキュリティグループを作成する
   * - インバウンド通信: ALB からの HTTP アクセスを許可
   * - アウトバウンド通信: すべて許可
   */
  private createEcsSecurityGroup(vpc: ec2.Vpc, resourceName: string): ec2.SecurityGroup {
    const sg = new ec2.SecurityGroup(this, 'EcsSecurityGroup', {
      securityGroupName: `${resourceName}-ecs-sg`,
      vpc,
      description: 'Allow HTTP inbound traffic. Allow all outbound traffic.',
      allowAllOutbound: true
    });
    sg.addIngressRule(this.albSecurityGroup, ec2.Port.tcp(3000), 'Allow HTTP inbound traffic');

    return sg;
  }

  /**
   * Redis に関連付けるセキュリティグループを作成する
   * - インバウンド通信: ECSからの Redis アクセスを許可(ポート: 6379)
   * - アウトバウンド通信: すべて許可
   */
  private createRedisSecurityGroup(vpc: ec2.Vpc, resourceName: string): ec2.SecurityGroup {
    const sg = new ec2.SecurityGroup(this, 'RedisSecurityGroup', {
      securityGroupName: `${resourceName}-redis-sg`,
      vpc,
      description: 'Allow Redis inbound traffic. Allow all outbound traffic.',
      allowAllOutbound: true
    });
    sg.addIngressRule(this.ecsSecurityGroup, ec2.Port.tcp(6379), 'Allow Redis inbound traffic');

    return sg;
  }

  /**
   * RDS に関連付けるセキュリティグループを作成する
   * - インバウンド通信: ECSからの PostgreSQL アクセスを許可(ポート: 5432)
   * - アウトバウンド通信: すべて許可
   */
  private createRdsSecurityGroup(vpc: ec2.Vpc, resourceName: string): ec2.SecurityGroup {
    const sg = new ec2.SecurityGroup(this, 'RdsSecurityGroup', {
      securityGroupName: `${resourceName}-rds-sg`,
      vpc,
      description: 'Allow PostgreSQL inbound traffic. Allow all outbound traffic.',
      allowAllOutbound: true
    });
    sg.addIngressRule(this.ecsSecurityGroup, ec2.Port.tcp(5432), 'Allow PostgreSQL inbound traffic');

    return sg;
  }
}
