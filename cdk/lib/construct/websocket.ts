// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Construct } from "constructs";
import { aws_lambda as lambda } from "aws-cdk-lib";
import * as agw from "@aws-cdk/aws-apigatewayv2-alpha";
import * as agwi from "@aws-cdk/aws-apigatewayv2-integrations-alpha";
import * as agwa from "@aws-cdk/aws-apigatewayv2-authorizers-alpha";

interface WebSocketProps {
    websocketHandler: lambda.IFunction;
    authHandler: lambda.IFunction;
    /**
     * The querystring key for setting Cognito idToken.
     */
    querystringKeyForIdToken?: string;
}

export class WebSocket extends Construct {
    readonly api: agw.WebSocketApi;
    private readonly defaultStageName = "prod";

    constructor(scope: Construct, id: string, props: WebSocketProps) {
        super(scope, id);

        const authorizer = new agwa.WebSocketLambdaAuthorizer("Authorizer", props.authHandler, {
            identitySource: [`route.request.querystring.${props.querystringKeyForIdToken ?? "idToken"}`],
        });

        this.api = new agw.WebSocketApi(this, "Api", {
            connectRouteOptions: {
                authorizer,
                integration: new agwi.WebSocketLambdaIntegration("ConnectIntegration", props.websocketHandler),
            },
            disconnectRouteOptions: {
                integration: new agwi.WebSocketLambdaIntegration("DisconnectIntegration", props.websocketHandler),
            },
            defaultRouteOptions: {
                integration: new agwi.WebSocketLambdaIntegration("DefaultIntegration", props.websocketHandler),
            },
        });

        new agw.WebSocketStage(this, `Stage`, {
            webSocketApi: this.api,
            stageName: this.defaultStageName,
            autoDeploy: true,
        });
    }

    get apiEndpoint() {
        return `${this.api.apiEndpoint}/${this.defaultStageName}`;
    }
}
