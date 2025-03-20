import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ecs from 'aws-cdk-lib/aws-ecs';

interface NameStackProps extends cdk.StackProps {
    cluster: cdk.aws_ecs.ICluster;
    securityGroup: cdk.aws_ec2.ISecurityGroup;
}

export class NameStack extends cdk.NestedStack {
    constructor(scope: Construct, id: string, props: NameStackProps) {
        super(scope, id, props);

        // Create Task Definition
        const taskDefinition = new ecs.Ec2TaskDefinition(this, 'TaskDefinition', {
            networkMode: ecs.NetworkMode.AWS_VPC,
        });

        const logDriver = ecs.LogDrivers.awsLogs({
            streamPrefix: 'copilot'
        });
        const container = taskDefinition.addContainer('name-service', {
            image: ecs.ContainerImage.fromAsset("src/name"),
            memoryLimitMiB: 512,
            cpu: 256,
            portMappings: [{
                containerPort: 3000,
                name: 'target',
            }],
            logging: logDriver,
        });

        // Create Service
        const service = new ecs.Ec2Service(this, "Service", {
            cluster: props.cluster,
            taskDefinition,
            securityGroups: [props.securityGroup],
            serviceConnectConfiguration: {
                logDriver,
                services: [{
                    portMappingName: 'target',
                    discoveryName: 'name-service-sc',
                    dnsName: 'name-service',
                }],
            }
        });
    }
}
