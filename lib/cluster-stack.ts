import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

export interface ClusterStackProps extends cdk.StackProps {
    readonly vpc: cdk.aws_ec2.IVpc;
}

export class ClusterStack extends cdk.NestedStack {
  public readonly cluster: cdk.aws_ecs.Cluster;

  constructor(scope: Construct, id: string, props: ClusterStackProps) {
    super(scope, id, props);

    this.cluster = new ecs.Cluster(this, 'ECSCluster', { 
        vpc: props.vpc,
        defaultCloudMapNamespace: {
            name: 'internal'
        }
    });

    this.cluster.addCapacity('DefaultAutoScalingGroup', {
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE3, ec2.InstanceSize.MEDIUM)
    });
  }
}
