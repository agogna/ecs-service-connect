import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import { NameStack } from './name-stack';
import { GreeterStack } from './greeter-stack';
import { GreetingStack } from './greeting-stack';

export class GreetingApplicationStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'VPC', { maxAzs: 2 });

    const securityGroup = new ec2.SecurityGroup(this, 'SecurityGroup', { vpc });
    const lbSecurityGroup = new ec2.SecurityGroup(this, 'LBSecurityGroup', { vpc, allowAllOutbound: false });
    securityGroup.addIngressRule(securityGroup, ec2.Port.allTraffic(), 'allow all traffic within the security group');

    const cluster = new ecs.Cluster(this, 'ECSCluster', {
      vpc,
      defaultCloudMapNamespace: {
        name: 'greeting-application.local',
        useForServiceConnect: true
      }
    });
    cluster.addCapacity('DefaultAutoScalingGroup', {
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE3, ec2.InstanceSize.MEDIUM)
    });

    const nameService = new NameStack(this, 'NameService', {
      ...props,
      cluster,
      securityGroup
    });

    const greetingService = new GreetingStack(this, 'GreetingService', {
      ...props,
      cluster,
      securityGroup
    });

    const greeterService = new GreeterStack(this, 'GreeterService', {
      ...props,
      cluster,
      securityGroup,
      lbSecurityGroup
    });

    greeterService.addDependency(nameService);
    greeterService.addDependency(greetingService);
  }
}
