// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { SynthUtils } from "@aws-cdk/assert";
import * as cdk from "@aws-cdk/core";
import { BackendStack } from "../lib/stack/backend";

test("Snapshot test", () => {
    const app = new cdk.App();
    const stack = new BackendStack(app, "BackendStack");
    expect(SynthUtils.toCloudFormation(stack)).toMatchSnapshot();
});
