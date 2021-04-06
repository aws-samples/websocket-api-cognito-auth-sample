#!/usr/bin/env node
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import "source-map-support/register";
import * as cdk from "@aws-cdk/core";
import { BackendStack } from "../lib/stack/backend";

const app = new cdk.App();
new BackendStack(app, `BackendStack`);
