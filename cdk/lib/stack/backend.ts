// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import * as cdk from "@aws-cdk/core";
import { Auth } from "../construct/auth";
import { Storage } from "../construct/storage";
import { Handler } from "../construct/handler";
import { WebSocket } from "../construct/websocket";

export class BackendStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const auth = new Auth(this, `auth`);
        const storage = new Storage(this, `storage`);
        const handler = new Handler(this, `handler`, {
            userPool: auth.userPool,
            userPoolClient: auth.userPoolClient,
            connectionIdTable: storage.connectionIdTable,
        });

        const websocket = new WebSocket(this, `websocket`, {
            authHandler: handler.authHandler,
            websocketHandler: handler.websocketHandler,
        });

        websocket.grantManagementApiAccess(handler.websocketHandler);

        {
            new cdk.CfnOutput(this, `Region`, {
                value: cdk.Stack.of(this).region,
            });

            new cdk.CfnOutput(this, `UserPoolId`, {
                value: auth.userPool.userPoolId,
            });

            new cdk.CfnOutput(this, `UserPoolWebClientId`, {
                value: auth.userPoolClient.userPoolClientId,
            });

            new cdk.CfnOutput(this, `WebSocketEndpoint`, {
                value: websocket.apiEndpoint,
            });
        }
    }
}
