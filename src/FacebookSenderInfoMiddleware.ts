import * as req from 'request-promise-native';
import { isNil } from 'lodash';
import { Middleware } from 'lexica-dialog-core/dist/Api';
import {
	MESSENGER_NAME,
	CONFIG_FACEBOOK_API_BASE_URL,
	CONFIG_FACEBOOK_ACCESS_TOKEN,
} from './Constants';

const facebookSenderInfoMiddleware: Middleware = async (context, next) => {
	const { uni, uniConfigs, messenger, request, senderInfo, senderInfoRepository } = context;
	if (messenger.name === MESSENGER_NAME && !isNil(request) && isNil(senderInfo)) {
		const { senderId } = request;
		const apiBaseUrl = uniConfigs.get(CONFIG_FACEBOOK_API_BASE_URL).value as string;
		const accessToken = uniConfigs.get(CONFIG_FACEBOOK_ACCESS_TOKEN).value as string;
		const response = await req({
			
			json: true,
			qs: {
				access_token: uniConfigs.get(CONFIG_FACEBOOK_ACCESS_TOKEN).value as string,
				fields: 'first_name,last_name,middle_name',
			},
			url: `${apiBaseUrl}/${senderId}`,
		});
		context.senderInfo = await senderInfoRepository.create({
			creationDate: new Date(),
			firstName: response.first_name,
			lastName: response.last_name,
			lastUpdatedDate: new Date(),
			messenger: MESSENGER_NAME,
			middleName: response.middle_name,
			senderId,
			uni,
		});
	}
	await next();
};

export default facebookSenderInfoMiddleware;
