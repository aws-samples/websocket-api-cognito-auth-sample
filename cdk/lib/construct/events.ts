import { Construct } from "constructs";
import { CfnApi, CfnApiKey, CfnChannelNamespace } from "aws-cdk-lib/aws-appsync";
import { CfnOutput, Names, Stack } from "aws-cdk-lib";
import { IUserPool } from "aws-cdk-lib/aws-cognito";

export interface EventsProps {
  userPool: IUserPool;
}

export class Events extends Construct {
  readonly endpoint: string;

  constructor(scope: Construct, id: string, props: EventsProps) {
    super(scope, id);

    // https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-appsync-api.html
    const api = new CfnApi(this, "Resource", {
      eventConfig: {
        authProviders: [
          { authType: "API_KEY" },
          {
            authType: "AMAZON_COGNITO_USER_POOLS",
            cognitoConfig: {
              awsRegion: Stack.of(props.userPool).region,
              userPoolId: props.userPool.userPoolId,
            },
          },
        ],
        connectionAuthModes: [{ authType: "API_KEY" }, { authType: "AMAZON_COGNITO_USER_POOLS" }],
        defaultPublishAuthModes: [{ authType: "API_KEY" }, { authType: "AMAZON_COGNITO_USER_POOLS" }],
        defaultSubscribeAuthModes: [{ authType: "API_KEY" }, { authType: "AMAZON_COGNITO_USER_POOLS" }],
      },
      name: Names.uniqueResourceName(this, { maxLength: 50, separator: "-" }),
    });
    const apiId = api.getAtt("ApiId").toString();

    const namespace = new CfnChannelNamespace(this, "Namespace", {
      apiId,
      name: "default",
    });

    // https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-appsync-apikey.html
    // const apiKey = new CfnApiKey(this, "ApiKey", {
    //   apiId,
    // });
    // new CfnOutput(this, "ApiKeyOutput", { value: apiKey.getAtt("ApiKey").toString() });

    this.endpoint = `https://${api.getAtt("Dns.Http").toString()}/event`;
  }
}
