// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import * as cdk from "@aws-cdk/core";
import * as dynamo from "@aws-cdk/aws-dynamodb";
import * as lambda from "@aws-cdk/aws-lambda";
import * as lambdanode from "@aws-cdk/aws-lambda-nodejs";
import * as cognito from "@aws-cdk/aws-cognito";

interface HandlerProps {
    connectionIdTable: dynamo.ITable;
    userPool: cognito.IUserPool;
    userPoolClient: cognito.IUserPoolClient;
}

export class Handler extends cdk.Construct {
    readonly authHandler: lambda.IFunction;
    readonly websocketHandler: lambda.IFunction;

    constructor(scope: cdk.Construct, id: string, props: HandlerProps) {
        super(scope, id);

        const authorizerLambda = new lambdanode.NodejsFunction(this, "authorizer", {
            entry: "../backend/authorizer/index.ts",
            environment: {
                USER_POOL_ID: props.userPool.userPoolId,
                USER_POOL_REGION: cdk.Stack.of(props.userPool).region,
                APP_CLIENT_ID: props.userPoolClient.userPoolClientId,
            },
        });

        const handler = new lambdanode.NodejsFunction(this, "handler", {
            entry: "../backend/websocket/index.ts",
            environment: {
                CONNECTION_TABLE_NAME: props.connectionIdTable.tableName,
            },
        });

        props.connectionIdTable.grantReadWriteData(handler);

        this.authHandler = authorizerLambda;
        this.websocketHandler = handler;
    }
}
