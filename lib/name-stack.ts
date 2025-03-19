import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ecs from 'aws-cdk-lib/aws-ecs';

interface NameStackProps extends cdk.StackProps {
    cluster: ecs.ICluster;
}

export class NameStack extends cdk.NestedStack {
    public readonly service: cdk.aws_ecs.Ec2Service;

    constructor(scope: Construct, id: string, props: NameStackProps) {
        super(scope, id, props);

        // Create Task Definition
        const taskDefinition = new ecs.Ec2TaskDefinition(this, 'TaskDefinition', {});

        const container = taskDefinition.addContainer('name', {
            image: ecs.ContainerImage.fromRegistry("public.ecr.aws/ecs-sample-image/name-server"),
            cpu: 256,
            memoryLimitMiB: 512,
            portMappings: [{
                containerPort: 80,
                hostPort: 80,
            }],
            logging: ecs.LogDrivers.awsLogs({
                streamPrefix: 'name',
                mode: ecs.AwsLogDriverMode.NON_BLOCKING,
                maxBufferSize: cdk.Size.mebibytes(25),
            }),
        });

        // Create Service
        this.service = new ecs.Ec2Service(this, "NameService", {
            cluster: props.cluster,
            taskDefinition,
            cloudMapOptions: {
                name: 'name',
                container: container,
            }
        });
    }
}
