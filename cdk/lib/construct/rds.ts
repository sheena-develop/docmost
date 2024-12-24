import { Construct } from 'constructs';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

interface RdsProps {
  vpc: ec2.Vpc;
  resourceName: string;
  securityGroup: ec2.SecurityGroup;
  subnets: ec2.SubnetSelection;
}

export class Rds extends Construct {
  public readonly value: rds.DatabaseInstance;
  public readonly rdsCredentials: rds.Credentials;

  constructor(scope: Construct, id: string, props: RdsProps) {
    super(scope, id);

    // NOTE: RDSのパラメータグループを作成
    const paramGroup = new rds.ParameterGroup(this, 'DocmostRdsParameterGroup', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_16_6,
      }),
      parameters: {
        'rds.force_ssl': '0'
      }
    });

    // NOTE: パスワードを自動生成してSecrets Managerに保存
    this.rdsCredentials = rds.Credentials.fromGeneratedSecret("docmost_user", {
      secretName: `/${props.resourceName}/rds/`,
    });

    // NOTE: プライマリインスタンスの作成
    this.value = new rds.DatabaseInstance(this, 'RdsPrimaryInstance', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_16_6
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      credentials: this.rdsCredentials,
      databaseName: 'docmost',
      vpc: props.vpc,
      vpcSubnets: props.subnets,
      networkType: rds.NetworkType.IPV4,
      securityGroups: [props.securityGroup],
      availabilityZone: 'ap-northeast-1a',
      parameterGroup: paramGroup
    });

    // NOTE: リードレプリカの作成
    new rds.DatabaseInstanceReadReplica(this, 'RdsReadReplica', {
      sourceDatabaseInstance: this.value,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      vpc: props.vpc,
      vpcSubnets: props.subnets,
      networkType: rds.NetworkType.IPV4,
      securityGroups: [props.securityGroup],
      availabilityZone: 'ap-northeast-1c',
      parameterGroup: paramGroup
    });
  }
}
