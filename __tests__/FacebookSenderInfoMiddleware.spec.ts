import { Map } from 'immutable';
import {
  BotContext,
  BotServerConfig,
} from 'lexica-dialog-core/dist/Api';
import { facebookSenderInfoMiddleware } from '../src';
import {
  MESSENGER_NAME,
  CONFIG_FACEBOOK_API_BASE_URL,
  CONFIG_FACEBOOK_ACCESS_TOKEN,
} from '../src/Constants';

jest.mock('request-promise-native', () => () => ({
  first_name: 'Lawrence',
  last_name: 'Cheung',
}));

describe('Facebook Sender Info Middleware', () => {
  it('should get sender\'s first name and last name', async () => {
    const context: any = {
      uni: 'hku',
      uniConfigs: Map<string, BotServerConfig>({
        [CONFIG_FACEBOOK_API_BASE_URL]: {
          uni: 'GLOBAL',
          key: CONFIG_FACEBOOK_API_BASE_URL,
          value: 'https://graph.facebook.com/v2.10',
        },
        [CONFIG_FACEBOOK_ACCESS_TOKEN]: {
          uni: 'GLOBAL',
          key: CONFIG_FACEBOOK_ACCESS_TOKEN,
          value: '123456',
        },
      }),
      messenger: {
        name: MESSENGER_NAME,
      },
      request: {
        senderId: '000000',
      },
      senderInfoRepository: {
        create: (obj: any) => ({
          id: '999999',
          ...obj,
        }),
      },
    };
    const next = () => Promise.resolve();
    await facebookSenderInfoMiddleware(context, next);
    expect(context.senderInfo).toBeDefined();
    expect(context.senderInfo.id).toBe('999999');
    expect(context.senderInfo.firstName).toBe('Lawrence');
    expect(context.senderInfo.lastName).toBe('Cheung');
  });
});
