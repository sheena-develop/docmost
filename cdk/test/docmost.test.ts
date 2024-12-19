import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { DocmostStack } from '../lib/docmost-stack';

describe('Snapshot testing', () => {
  test('Snapshot testing for DocmostStack', () => {
    const app = new cdk.App();
    const stack = new DocmostStack(app, 'DocmostStack');
    expect(Template.fromStack(stack).toJSON()).toMatchSnapshot();
  });
});
