import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as albv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';

interface GreeterStackProps extends cdk.StackProps {
    cluster: cdk.aws_ecs.ICluster;
    securityGroup: cdk.aws_ec2.ISecurityGroup;
    lbSecurityGroup: cdk.aws_ec2.ISecurityGroup;
}

export class GreeterStack extends cdk.NestedStack {
    constructor(scope: Construct, id: string, props: GreeterStackProps) {
        super(scope, id, props);

        // Create Task Definition
        const taskDefinition = new ecs.FargateTaskDefinition(this, 'TaskDefinition', {
            memoryLimitMiB: 512,
            cpu: 256
        });

        const logDriver = ecs.LogDrivers.awsLogs({
            streamPrefix: 'copilot'
        });

        const container = taskDefinition.addContainer('greeter-service', {
            image: ecs.ContainerImage.fromAsset("src/greeter"),
            environment: {
                NAME_URL: "http://name-service:3000",
                GREETING_URL: "http://greeting-service:3000",
            },
            portMappings: [{
                containerPort: 3000,
                name: 'target',
            }],
            logging: logDriver,
        });

        // Create Service
        const { service } = new ecsPatterns.ApplicationLoadBalancedFargateService(this, 'Service', {
            cluster: props.cluster,
            loadBalancer: new albv2.ApplicationLoadBalancer(this, 'ALB', {
                vpc: props.cluster.vpc,
                internetFacing: true,
                securityGroup: props.lbSecurityGroup,
            }),
            taskDefinition: taskDefinition,
            securityGroups: [props.securityGroup],
        });
        
        service.enableServiceConnect({
            logDriver,
            services: [{
                portMappingName: 'target',
                discoveryName: 'greeter-service-sc',
                dnsName: 'greeter-service',
            }],
        });
    }
}
