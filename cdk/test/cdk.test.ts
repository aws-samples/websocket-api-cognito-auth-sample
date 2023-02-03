// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { App } from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { BackendStack } from "../lib/stack/backend";

test("Snapshot test", () => {
  const app = new App();
  const stack = new BackendStack(app, "BackendStack");
  expect(Template.fromStack(stack)).toMatchSnapshot();
});
