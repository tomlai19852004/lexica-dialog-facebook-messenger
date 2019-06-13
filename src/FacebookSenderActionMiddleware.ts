import * as req from "request-promise-native";
import { isNil } from "lodash";
import { Middleware, RunTimeConfig } from "lexica-dialog-core/dist/Api";
import {
  MESSENGER_NAME,
  CONFIG_FACEBOOK_API_BASE_URL,
  CONFIG_FACEBOOK_ACCESS_TOKEN
} from "./Constants";

function sendAction(
  senderId: string,
  apiBaseUrl: string,
  accessToken: string,
  senderAction: string
) {
  return req({
    json: {
      recipient: {
        id: senderId
      },
      sender_action: senderAction
    },
    method: "POST",
    qs: {
      access_token: accessToken
    },
    uri: `${apiBaseUrl}/me/messages`
  });
}

const facebookSenderActionMiddleware: Middleware = async (context, next) => {
  const { uniConfigs, messenger, request, logger } = context;
  if (messenger.name === MESSENGER_NAME && !isNil(request)) {
    const { senderId } = request;
    const apiBaseUrl = uniConfigs.get(CONFIG_FACEBOOK_API_BASE_URL)
      .value as string;
    const accessToken = uniConfigs.get(CONFIG_FACEBOOK_ACCESS_TOKEN)
      .value as string;

    const actionItems: any = [
      sendAction(senderId, apiBaseUrl, accessToken, "mark_seen")
    ];

    if (uniConfigs.get(RunTimeConfig.SUSPEND_AUTO_REPLY)) {
      actionItems.push(
        sendAction(senderId, apiBaseUrl, accessToken, "typing_on")
      );
    }

    Promise.all(actionItems).catch(error =>
      logger.error("Call Facebook sender action with error", error)
    );
  }
  await next();
};

export default facebookSenderActionMiddleware;
