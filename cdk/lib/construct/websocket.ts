// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import * as cdk from "@aws-cdk/core";
import * as lambda from "@aws-cdk/aws-lambda";
import * as iam from "@aws-cdk/aws-iam";
import * as agw from "@aws-cdk/aws-apigatewayv2";
import * as agwi from "@aws-cdk/aws-apigatewayv2-integrations";

interface WebSocketProps {
    websocketHandler: lambda.IFunction;
    authHandler: lambda.IFunction;
    /**
     * The querystring key for setting Cognito idToken.
     */
    querystringKeyForIdToken?: string;
}

export class WebSocket extends cdk.Construct {
    readonly api: agw.WebSocketApi;
    private readonly defaultStageName = "prod";

    constructor(scope: cdk.Construct, id: string, props: WebSocketProps) {
        super(scope, id);

        const integration = new agwi.LambdaWebSocketIntegration({
            handler: props.websocketHandler,
        });

        this.api = new agw.WebSocketApi(this, `api`, {
            connectRouteOptions: {
                integration,
            },
            disconnectRouteOptions: {
                integration,
            },
            defaultRouteOptions: {
                integration,
            },
        });

        new agw.WebSocketStage(this, `stage`, {
            webSocketApi: this.api,
            stageName: this.defaultStageName,
            autoDeploy: true,
        });

        // create an authorizer for $connect route.
        // We fetch L1 construct because currently L2 WebSocket API construct doesn't support authorizers.
        const authorizer = this.createLambdaAuthorizer(props.authHandler, props.querystringKeyForIdToken ?? "idToken");
        const connectRoute = this.api.node.findChild("$connect-Route").node.defaultChild as agw.CfnRoute;
        connectRoute.authorizationType = "CUSTOM";
        connectRoute.authorizerId = authorizer.ref;
    }

    grantManagementApiAccess(principal: iam.IGrantable) {
        principal.grantPrincipal.addToPrincipalPolicy(
            new iam.PolicyStatement({
                actions: ["execute-api:ManageConnections"],
                resources: [`${this.apiArn}/*`],
            }),
        );
    }

    get apiEndpoint() {
        return `${this.api.apiEndpoint}/${this.defaultStageName}`;
    }

    private get apiRef() {
        return (this.api.node.defaultChild as agw.CfnApi).ref;
    }

    private get apiArn() {
        return cdk.Stack.of(this).formatArn({
            service: "execute-api",
            resource: this.apiRef,
        });
    }

    private createLambdaAuthorizer(handler: lambda.IFunction, tokenKey: string): agw.CfnAuthorizer {
        const authorizer = new agw.CfnAuthorizer(this, "authorizer", {
            apiId: this.apiRef,
            authorizerType: "REQUEST",
            identitySource: [`route.request.querystring.${tokenKey}`],
            name: "lambdaAuthorizer",
            authorizerUri: this.integrationUri(handler),
        });

        handler.addPermission(`${cdk.Names.uniqueId(this)}:Permissions`, {
            principal: new iam.ServicePrincipal("apigateway.amazonaws.com"),
            sourceArn: `${this.apiArn}/authorizers/${authorizer.ref}`,
        });

        return authorizer;
    }

    private integrationUri(handler: lambda.IFunction): string {
        const path = ["2015-03-31", "functions", handler.functionArn, "invocations"].join("/");

        return cdk.Stack.of(this).formatArn({
            service: "apigateway",
            account: "lambda",
            resource: "path",
            resourceName: path,
        });
    }
}
