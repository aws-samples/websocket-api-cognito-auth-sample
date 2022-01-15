#!/usr/bin/env node
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { App } from "aws-cdk-lib";
import "source-map-support/register";
import { BackendStack } from "../lib/stack/backend";

const app = new App();
new BackendStack(app, `BackendStack`);
