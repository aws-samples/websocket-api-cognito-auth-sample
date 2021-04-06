// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import * as cdk from "@aws-cdk/core";
import * as dynamo from "@aws-cdk/aws-dynamodb";

export class Storage extends cdk.Construct {
    readonly connectionIdTable: dynamo.ITable;

    constructor(scope: cdk.Construct, id: string) {
        super(scope, id);

        const connectionIdTable = new dynamo.Table(this, "connectionIdTable", {
            partitionKey: { name: "connectionId", type: dynamo.AttributeType.STRING },
            timeToLiveAttribute: "removedAt",
            billingMode: dynamo.BillingMode.PAY_PER_REQUEST,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });

        connectionIdTable.addGlobalSecondaryIndex({
            partitionKey: { name: "userId", type: dynamo.AttributeType.STRING },
            indexName: "userIdIndex",
        });

        this.connectionIdTable = connectionIdTable;
    }
}
