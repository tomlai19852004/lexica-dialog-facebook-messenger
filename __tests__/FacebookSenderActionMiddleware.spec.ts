import { Map } from 'immutable';
import {
  BotContext,
  BotServerConfig,
} from 'lexica-dialog-core/dist/Api';
import { facebookSenderActionMiddleware } from '../src';
import {
  MESSENGER_NAME,
  CONFIG_FACEBOOK_API_BASE_URL,
  CONFIG_FACEBOOK_ACCESS_TOKEN,
} from '../src/Constants';

jest.mock('request-promise-native');

import * as request from 'request-promise-native';

describe('Facebook Sender Action Middleware', () => {
  it('should send action to Facebook', async () => {
    const apiBaseUrl = 'https://graph.facebook.com/v2.10';
    const accessToken = '123456';
    const senderId = '000000';
    const context: any = {
      uniConfigs: Map<string, BotServerConfig>({
        [CONFIG_FACEBOOK_API_BASE_URL]: {
          uni: 'GLOBAL',
          key: CONFIG_FACEBOOK_API_BASE_URL,
          value: apiBaseUrl,
        },
        [CONFIG_FACEBOOK_ACCESS_TOKEN]: {
          uni: 'GLOBAL',
          key: CONFIG_FACEBOOK_ACCESS_TOKEN,
          value: accessToken,
        },
      }),
      messenger: {
        name: MESSENGER_NAME,
      },
      request: {
        senderId,
      },
    };
    const next = () => Promise.resolve();
    await facebookSenderActionMiddleware(context, next);
    expect(request).toBeCalled();
    expect(request).toBeCalledWith({
      uri: apiBaseUrl + '/me/messages',
      qs: { access_token: accessToken },
      method: 'POST',
      json: {
        sender_action: 'mark_seen',
        recipient: {
          id: senderId,
        },
      },
    });
    // expect(request).toBeCalledWith({
    //   uri: apiBaseUrl + '/me/messages',
    //   qs: { access_token: accessToken },
    //   method: 'POST',
    //   json: {
    //     sender_action: 'typing_on',
    //     recipient: {
    //       id: senderId,
    //     },
    //   },
    // });
  });
});
