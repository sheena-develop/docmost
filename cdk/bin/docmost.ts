#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { DocmostStack } from '../lib/docmost-stack';

const app = new cdk.App();
new DocmostStack(app, 'DocmostStack');
