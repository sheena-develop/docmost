import { Construct } from 'constructs';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';

interface AcmProps {
  resourceName: string;
  domainName: string;
  hostZone: route53.PublicHostedZone;
}

export class Acm extends Construct {
  public readonly value: acm.Certificate;

  constructor(scope: Construct, id: string, props: AcmProps) {
    super(scope, id);

    this.value = new acm.Certificate(this, 'SslCertificateDomain', {
      domainName: props.domainName,
      keyAlgorithm: acm.KeyAlgorithm.RSA_2048,
      validation: acm.CertificateValidation.fromDns(props.hostZone)
    });
  }
}
