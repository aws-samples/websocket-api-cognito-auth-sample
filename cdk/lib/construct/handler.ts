// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Construct } from "constructs";
import { aws_dynamodb as dynamo, aws_lambda as lambda, aws_lambda_nodejs as lambdanode, aws_cognito as cognito, RemovalPolicy } from "aws-cdk-lib";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";

interface HandlerProps {
  connectionIdTable: dynamo.ITable;
  userPool: cognito.IUserPool;
  userPoolClient: cognito.IUserPoolClient;
}

export class Handler extends Construct {
  readonly authHandler: lambda.IFunction;
  readonly websocketHandler: lambda.IFunction;

  constructor(scope: Construct, id: string, props: HandlerProps) {
    super(scope, id);

    const authHandler = new NodejsFunction(this, "AuthHandler", {
      runtime: Runtime.NODEJS_22_X,
      entry: "../backend/authorizer/index.ts",
      environment: {
        USER_POOL_ID: props.userPool.userPoolId,
        APP_CLIENT_ID: props.userPoolClient.userPoolClientId,
      },
      bundling: {
        commandHooks: {
          beforeBundling: (i, o) => [`cd ${i} && npm ci`],
          afterBundling: (i, o) => [],
          beforeInstall: (i, o) => [],
        },
      },
      depsLockFilePath: "../backend/package-lock.json",
    });

    const websocketHandler = new lambdanode.NodejsFunction(this, "WebSocketHandler", {
      runtime: Runtime.NODEJS_22_X,
      entry: "../backend/websocket/index.ts",
      environment: {
        CONNECTION_TABLE_NAME: props.connectionIdTable.tableName,
      },
      bundling: {
        commandHooks: {
          beforeBundling: (i, o) => [`cd ${i} && npm ci`],
          afterBundling: (i, o) => [],
          beforeInstall: (i, o) => [],
        },
      },
      depsLockFilePath: "../backend/package-lock.json",
    });

    props.connectionIdTable.grantReadWriteData(websocketHandler);

    this.authHandler = authHandler;
    this.websocketHandler = websocketHandler;
  }
}
