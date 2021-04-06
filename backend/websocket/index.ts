// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import * as aws from "aws-sdk";
import { APIGatewayProxyHandler } from "aws-lambda";
import { AWSError } from "aws-sdk";

const docClient = new aws.DynamoDB.DocumentClient();
const ConnectionTableName = process.env.CONNECTION_TABLE_NAME!;

export const handler: APIGatewayProxyHandler = async (event, context) => {
    const routeKey = event.requestContext.routeKey!;
    const connectionId = event.requestContext.connectionId!;

    if (routeKey == "$connect") {
        const userId = event.requestContext.authorizer?.userId;

        try {
            await docClient
                .put({
                    TableName: ConnectionTableName,
                    Item: {
                        userId: userId,
                        connectionId: connectionId,
                        removedAt: Math.ceil(Date.now() / 1000) + 3600 * 3,
                    },
                })
                .promise();
            return { statusCode: 200, body: "Connected." };
        } catch (err) {
            console.error(err);
            return { statusCode: 500, body: "Connection failed." };
        }
    }
    if (routeKey == "$disconnect") {
        try {
            await removeConnectionId(connectionId);
            return { statusCode: 200, body: "Disconnected." };
        } catch (err) {
            console.error(err);
            return { statusCode: 500, body: "Disconnection failed." };
        }
    }

    const managementApi = new aws.ApiGatewayManagementApi({
        endpoint: `${event.requestContext.domainName}/${event.requestContext.stage}`,
    });

    try {
        await managementApi
            .postToConnection({
                ConnectionId: connectionId,
                Data: JSON.stringify({ message: event.body }),
            })
            .promise();
    } catch (e) {
        const error: AWSError = e;
        if (error.statusCode == 410) {
            await removeConnectionId(connectionId);
        } else {
            throw e;
        }
    }

    return { statusCode: 200, body: "Received." };
};

const removeConnectionId = async (connectionId: string) => {
    return await docClient
        .delete({
            TableName: ConnectionTableName,
            Key: {
                connectionId,
            },
        })
        .promise();
};
