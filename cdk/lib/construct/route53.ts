import { Construct } from 'constructs';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';

interface Route53Props {
  resourceName: string;
  domainName: string;
}

interface ARecordProps {
  hostZone: route53.PublicHostedZone;
  alb: elbv2.ApplicationLoadBalancer;
  regionName: string;
}

export class Route53 extends Construct {
  public readonly value: route53.PublicHostedZone;

  constructor(scope: Construct, id: string, props: Route53Props) {
    super(scope, id);

    this.value = new route53.PublicHostedZone(this, 'HostZone', {
      zoneName: props.domainName
    });
  }

  // ルートドメインの A レコードを ALB に紐付け
  public addARecord(id: string, props: ARecordProps): void {
    new route53.ARecord(this, id, {
      zone: props.hostZone,
      target: route53.RecordTarget.fromAlias(new targets.LoadBalancerTarget(props.alb)),
      region: props.regionName
    });
  }
}
