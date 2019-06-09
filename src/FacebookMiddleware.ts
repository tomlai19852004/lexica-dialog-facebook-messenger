import { Middleware } from "lexica-dialog-core/dist/Api";
import { MESSENGER_NAME, CONFIG_FACEBOOK_VERIFY_TOKEN } from "./Constants";

const facebookMiddleware: Middleware = async (context, next) => {
  const { serverContext, messenger, uniConfigs, logger } = context;
  if (messenger.name === MESSENGER_NAME) {
    let verifyToken;

    if (uniConfigs.has(CONFIG_FACEBOOK_VERIFY_TOKEN)) {
      verifyToken = uniConfigs.get(CONFIG_FACEBOOK_VERIFY_TOKEN)
        .value as string;
    } else {
      throw new Error("UNI Config not found: " + CONFIG_FACEBOOK_VERIFY_TOKEN);
    }

    if (
      serverContext.method === "GET" &&
      serverContext.query["hub.mode"] === "subscribe" &&
      serverContext.query["hub.verify_token"] === verifyToken
    ) {
      serverContext.status = 200;
      serverContext.body = serverContext.query["hub.challenge"];
    } else if (serverContext.method === "POST") {
      // Async
      const { rawRequest } = context;
      serverContext.status = 200;
      serverContext.body = "OK";
      next().catch(error =>
        logger.error("Error catched by Facebook middleware", rawRequest, error)
      );
    } else {
      await next();
    }
  } else {
    await next();
  }
};

export default facebookMiddleware;
