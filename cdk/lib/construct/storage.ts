// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Construct } from "constructs";
import { aws_dynamodb as dynamo, RemovalPolicy } from "aws-cdk-lib";

export class Storage extends Construct {
  readonly connectionIdTable: dynamo.ITable;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    const connectionIdTable = new dynamo.Table(this, "ConnectionIdTable", {
      partitionKey: { name: "connectionId", type: dynamo.AttributeType.STRING },
      timeToLiveAttribute: "removedAt",
      billingMode: dynamo.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    connectionIdTable.addGlobalSecondaryIndex({
      partitionKey: { name: "userId", type: dynamo.AttributeType.STRING },
      indexName: "userIdIndex",
    });

    this.connectionIdTable = connectionIdTable;
  }
}
