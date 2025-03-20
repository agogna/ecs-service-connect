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
        const taskDefinition = new ecs.Ec2TaskDefinition(this, 'TaskDefinition', {
            networkMode: ecs.NetworkMode.AWS_VPC,
        });

        const logDriver = ecs.LogDrivers.awsLogs({
            streamPrefix: 'copilot'
        });

        const container = taskDefinition.addContainer('greeter-service', {
            image: ecs.ContainerImage.fromAsset("src/greeter"),
            memoryLimitMiB: 512,
            cpu: 256,
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

        const service = new ecs.Ec2Service(this, "Service", {
            cluster: props.cluster,
            taskDefinition,
            securityGroups: [props.securityGroup],
            serviceConnectConfiguration: {
                logDriver,
                services: [{
                    portMappingName: 'target',
                    discoveryName: 'greeter-service-sc',
                    dnsName: 'greeter-service',
                }],
            }
        });

        const alb = new albv2.ApplicationLoadBalancer(this, 'ALB', {
            vpc: props.cluster.vpc,
            internetFacing: true,
            securityGroup: props.lbSecurityGroup,
        });

        const listener = alb.addListener('PublicListener', { port: 80, open: true });

        // Attach ALB to ECS Service
        listener.addTargets('ECS', {
            port: 80,
            targets: [service.loadBalancerTarget({
                containerName: 'greeter-service'
            })],
            // include health check (default is none)
            healthCheck: {
                interval: cdk.Duration.seconds(60),
                path: "/",
                timeout: cdk.Duration.seconds(5),
            }
        });
    }
}
