#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { DocmostStack } from '../lib/cdk-stack';

const app = new cdk.App();
new DocmostStack(app, 'DocmostStack');
