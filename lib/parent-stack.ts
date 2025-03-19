import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { VpcStack } from './vpc-stack';
import { ClusterStack } from './cluster-stack';
import { NameStack } from './name-stack';
import { HelloStack } from './hello-stack';

export class ParentStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    const vpcStack = new VpcStack(this, 'VpcStack', props);
    const clusterStack = new ClusterStack(this, 'ClusterStack', {
      ...props,
      vpc: vpcStack.vpc
    });
    const nameService = new NameStack(this, 'NameService', {
      ...props,
      cluster: clusterStack.cluster
    });
    const helloService = new HelloStack(this, 'HelloService', {
      ...props,
      cluster: clusterStack.cluster,
      nameService: nameService.service
    });
  }
}
