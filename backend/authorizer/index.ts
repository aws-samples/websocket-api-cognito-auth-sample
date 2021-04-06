// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import * as jwt from "jsonwebtoken";
import axios from "axios";
import jwkToPem from "jwk-to-pem";
import { APIGatewayRequestAuthorizerHandler } from "aws-lambda";

const UserPoolId = process.env.USER_POOL_ID!;
const UserPoolRegion = process.env.USER_POOL_REGION!;
const AppClientId = process.env.APP_CLIENT_ID!;
const jwkCache: { [key: string]: jwkToPem.JWK } = {};

export const handler: APIGatewayRequestAuthorizerHandler = async (event, context) => {
    try {
        const encodedToken = event.queryStringParameters!.idToken!;
        const token = jwt.decode(encodedToken, { complete: true })!;

        if (typeof token == "string") throw Error("invalid jwt.");

        const jwk = await getJwkByKid(token.payload.iss, token.header.kid);
        const pem = jwkToPem(jwk);
        jwt.verify(encodedToken, pem);
        verifyClaims(token.payload, AppClientId, UserPoolId, UserPoolRegion);

        return allowPolicy(event.methodArn, token.payload);
    } catch (error) {
        console.log(error.message);
        return denyAllPolicy();
    }
};

// https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-using-tokens-verifying-a-jwt.html
const verifyClaims = (jwtPayload: any, appClientId: string, userPoolId: string, userPoolRegion: string) => {
    if (jwtPayload.exp * 1000 < Date.now()) {
        throw Error(`token expired.`);
    }

    const iss = jwtPayload.iss;
    if (iss != `https://cognito-idp.${userPoolRegion}.amazonaws.com/${userPoolId}`) {
        throw Error(`wrong iss. ${iss}`);
    }

    const aud = jwtPayload.aud;
    if (aud != appClientId) {
        throw Error(`wrong aud. ${aud}`);
    }

    const token_use = jwtPayload.token_use;
    if (token_use != "id") {
        throw Error(`wrong token_use. ${token_use}`);
    }
};

const getJwkByKid = async (iss: string, kid: string) => {
    if (kid in jwkCache) {
        return jwkCache[kid];
    }

    const jwksEndpoint = iss + "/.well-known/jwks.json";
    const json = await axios.get(jwksEndpoint);
    for (const key of json.data.keys) {
        jwkCache[key.kid] = key;
    }

    return jwkCache[kid];
};

const denyAllPolicy = () => {
    return {
        principalId: "*",
        policyDocument: {
            Version: "2012-10-17",
            Statement: [
                {
                    Action: "*",
                    Effect: "Deny",
                    Resource: "*",
                },
            ],
        },
    };
};

const allowPolicy = (methodArn: string, idToken: any) => {
    return {
        principalId: idToken.sub,
        policyDocument: {
            Version: "2012-10-17",
            Statement: [
                {
                    Action: "execute-api:Invoke",
                    Effect: "Allow",
                    Resource: methodArn,
                },
            ],
        },
        context: {
            // set userId in the context
            userId: idToken.sub,
        },
    };
};
