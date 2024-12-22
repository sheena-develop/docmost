import type { SelectedSubnets } from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

export class Vpc extends Construct {
  public readonly value: ec2.Vpc;
  private readonly albPublicSubnetName: string;
  private readonly ecsPrivateWithEgressSubnetName: string;
  private readonly redisPrivateIsolatedSubnetName: string;
  private readonly rdsPrivateIsolatedSubnetName: string;

  constructor(scope: Construct, id: string, private readonly resourceName: string) {
    super(scope, id);

    this.albPublicSubnetName = `${this.resourceName}-alb-public`;
    this.ecsPrivateWithEgressSubnetName = `${this.resourceName}-ecs-egress`;
    this.redisPrivateIsolatedSubnetName = `${this.resourceName}-redis-isolated`;
    this.rdsPrivateIsolatedSubnetName = `${this.resourceName}-rds-isolated`;

    this.value = new ec2.Vpc(this, 'Vpc', {
      vpcName: `${this.resourceName}-vpc`,
      availabilityZones: ['ap-northeast-1a', 'ap-northeast-1c'],
      enableDnsHostnames: true,
      enableDnsSupport: true,
      natGateways: 1,
      natGatewaySubnets: {
        subnetGroupName: this.albPublicSubnetName
      },
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      subnetConfiguration: [
        {
          name: this.albPublicSubnetName,
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24
        },
        {
          name: this.ecsPrivateWithEgressSubnetName,
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24
        },
        {
          name: this.redisPrivateIsolatedSubnetName,
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24
        },
        {
          name: this.rdsPrivateIsolatedSubnetName,
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24
        }
      ]
    });
  }

  public getAlbPublicSubnets(): SelectedSubnets {
    return this.value.selectSubnets({ subnetGroupName: this.albPublicSubnetName });
  }

  public getEcsPrivateWithEgressSubnets(): SelectedSubnets {
    return this.value.selectSubnets({ subnetGroupName: this.ecsPrivateWithEgressSubnetName });
  }

  public getRedisPrivateIsolatedSubnets(): SelectedSubnets {
    return this.value.selectSubnets({ subnetGroupName: this.redisPrivateIsolatedSubnetName });
  }

  public getRdsPrivateIsolatedSubnets(): SelectedSubnets {
    return this.value.selectSubnets({ subnetGroupName: this.rdsPrivateIsolatedSubnetName });
  }
}
