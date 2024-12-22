import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';

interface AlbProps {
  vpc: ec2.Vpc;
  resourceName: string;
  securityGroup: ec2.SecurityGroup;
  subnets: ec2.SubnetSelection;
  certificateArn: string;
}

export class Alb extends Construct {
  public readonly value: elbv2.ApplicationLoadBalancer;
  private readonly listener: elbv2.ApplicationListener;

  constructor(scope: Construct, id: string, props: AlbProps) {
    super(scope, id);

    // NOTE: ACM証明書のインポート
    const certificate = elbv2.ListenerCertificate.fromArn(props.certificateArn);

    // NOTE: ターゲットグループの作成
    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'AlbTargetGroup', {
      targetGroupName: `${props.resourceName}-alb-tg`,
      vpc: props.vpc,
      targetType: elbv2.TargetType.IP,
      protocol: elbv2.ApplicationProtocol.HTTP,
      port: 3000,
      healthCheck: {
        path: '/health',
        port: '3000',
        protocol: elbv2.Protocol.HTTP,
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        healthyThresholdCount: 3,
        unhealthyThresholdCount: 3
      }
    });

    // NOTE: ALBの作成
    this.value = new elbv2.ApplicationLoadBalancer(this, 'Alb', {
      loadBalancerName: `${props.resourceName}-alb`,
      vpc: props.vpc,
      internetFacing: true,
      securityGroup: props.securityGroup,
      vpcSubnets: props.subnets
    });

    // NOTE: リスナーの作成
    this.listener = this.value.addListener('AlbListener', {
      protocol: elbv2.ApplicationProtocol.HTTPS,
      port: 443,
      certificates: [certificate],
      defaultTargetGroups: [targetGroup]
    });
  }

  public addTargets(id: string, props: elbv2.AddApplicationTargetsProps): void {
    this.listener.addTargets(id, {
      ...props,
      port: 3000,
      protocol: elbv2.ApplicationProtocol.HTTP,
      healthCheck: {
        path: '/health',
        port: '3000',
        protocol: elbv2.Protocol.HTTP,
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        healthyThresholdCount: 3,
        unhealthyThresholdCount: 3
      }
    });
  }
}
