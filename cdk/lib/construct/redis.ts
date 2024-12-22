import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';

interface RedisProps {
  vpc: ec2.Vpc;
  resourceName: string;
  securityGroup: ec2.SecurityGroup;
  subnets: ec2.SubnetSelection;
}

export class Redis extends Construct {
  constructor(scope: Construct, id: string, props: RedisProps) {
    super(scope, id);

    const subnetIds = props.vpc.selectSubnets(props.subnets).subnetIds;
    const securityGroupId = props.securityGroup.securityGroupId;

    // NOTE: Redis の作成
    new elasticache.CfnServerlessCache(this, 'Redis', {
      engine: 'redis',
      serverlessCacheName: `${props.resourceName}-redis`,
      securityGroupIds: [securityGroupId],
      subnetIds: subnetIds
    });
  }
}
