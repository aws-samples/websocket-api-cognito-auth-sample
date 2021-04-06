// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import * as cdk from "@aws-cdk/core";
import * as cognito from "@aws-cdk/aws-cognito";

export class Auth extends cdk.Construct {
    readonly userPool: cognito.IUserPool;
    readonly userPoolClient: cognito.IUserPoolClient;

    constructor(scope: cdk.Construct, id: string) {
        super(scope, id);

        const userPool = new cognito.UserPool(this, "userPool", {
            selfSignUpEnabled: true,
            autoVerify: {
                email: true,
            },
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });

        const client = userPool.addClient(`client`, {
            authFlows: {
                userPassword: true,
                userSrp: true,
            },
        });

        this.userPool = userPool;
        this.userPoolClient = client;
    }
}
