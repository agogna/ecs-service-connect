import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns';

interface HelloStackProps extends cdk.StackProps {
    cluster: ecs.ICluster;
    nameService: ecs.BaseService;
}

export class HelloStack extends cdk.NestedStack {
    constructor(scope: Construct, id: string, props: HelloStackProps) {
        super(scope, id, props);

        // Create Task Definition
        const taskDefinition = new ecs.Ec2TaskDefinition(this, 'TaskDefinition', {});

        const container = taskDefinition.addContainer('hello', {
            image: ecs.ContainerImage.fromRegistry("public.ecr.aws/ecs-sample-image/hello-server:node"),
            cpu: 256,
            memoryLimitMiB: 512,
            environment: {
                NAME_SERVER: 'http://name.internal:3000/',
            },
            portMappings: [{
                containerPort: 3000,
                hostPort: 3000,
            }],
            logging: ecs.LogDrivers.awsLogs({
                streamPrefix: 'hello',
                mode: ecs.AwsLogDriverMode.NON_BLOCKING,
                maxBufferSize: cdk.Size.mebibytes(25),
            }),
        });

        // Create Service
        const loadBalancedFargateService = new ecsPatterns.ApplicationLoadBalancedEc2Service(this, 'Service', {
            cluster: props.cluster,
            taskDefinition: taskDefinition,
            desiredCount: 2,
        });

        loadBalancedFargateService.service.connections.allowTo(props.nameService, cdk.aws_ec2.Port.tcp(3000));
    }
}
