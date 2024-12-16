import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Vpc, IpAddresses, SubnetType } from 'aws-cdk-lib/aws-ec2';

export class DocmostStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // https://docs.aws.amazon.com/cdk/api/v2/docs/aws-construct-library.html
    const vpc = new Vpc(this, 'DocmostVpc', {
      ipAddresses: IpAddresses.cidr('10.0.0.0/16'),
    });

    vpc.selectSubnets({
      subnetType: SubnetType.PRIVATE_WITH_EGRESS
    });
  }
}
