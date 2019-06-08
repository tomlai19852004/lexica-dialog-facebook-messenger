import { List, Map } from 'immutable';
import { Context } from 'koa';
import * as req from 'request-promise-native';
import { isNil } from 'lodash';
import { Config } from 'lexica-dialog-model/dist/Config';
import { ResponseType } from 'lexica-dialog-model/dist/Intent';
import { Messenger, BotRequest, BotResponse, RequestType } from 'lexica-dialog-core/dist/Api';
import {
	Request,
	Response,
	TextRequestMessaging,
	FileRequestMessaging,
	ResponseMessageType,
	ResponseMessageTemplateType,
	ButtonType,
	FileType,
	PostBackMessaging,
	QuickReplyMessageContentType,
	ButtonTemplate,
	GenericTemplate,
	MessagingType,
} from './Types';
import {
	MESSENGER_NAME,
	CONFIG_FACEBOOK_API_BASE_URL,
	CONFIG_FACEBOOK_ACCESS_TOKEN,
} from './Constants';

class FacebookMessenger implements Messenger<Request, Response> {

	public name = MESSENGER_NAME;

	constructor(private readonly locale: string) { }

	public request(request: Request): BotRequest {
		const messaging: any = request.entry[0].messaging[0];
		let botRequest: BotRequest | undefined;
		if (!isNil(messaging) && !isNil(messaging.message)) {
			const message = messaging.message;
			if (messaging.message.hasOwnProperty('text')
				|| messaging.message.hasOwnProperty('quick_reply')) {
				const textMessaging = (messaging as TextRequestMessaging);
				const message = textMessaging.message;
				if (!isNil(message.quick_reply)) {
					const command = JSON.parse(message.quick_reply.payload);
					botRequest = {
						commands: List([{
							features: Map<string, string>(command.features),
							name: command.name,
						}]),
						locale: this.locale,
						message: textMessaging.message.text,
						senderId: messaging.sender.id,
						type: RequestType.TEXT,
					};
				} else {
					botRequest = {
						locale: this.locale,
						message: textMessaging.message.text,
						senderId: messaging.sender.id,
						type: RequestType.TEXT,
					};
				}
			} else if (messaging.message.hasOwnProperty('attachments')) {

				const fileMessaging = (messaging as FileRequestMessaging);
				const facebookType = fileMessaging.message.attachments[0].type;

				if (facebookType === FileType.AUDIO
					|| facebookType === FileType.IMAGE
					|| facebookType === FileType.VIDEO
					|| facebookType === FileType.FILE) {

					let type;
					switch (facebookType) {
						case FileType.AUDIO:
							type = RequestType.AUDIO;
							break;
						case FileType.FILE:
							type = RequestType.FILE;
							break;
						case FileType.IMAGE:
							type = RequestType.IMAGE;
							break;
						case FileType.VIDEO:
							type = RequestType.VIDEO;
							break;
						default:
							type = RequestType.FILE;
							break;
					}
					botRequest = {
						fileUrl: fileMessaging.message.attachments[0].payload.url,
						locale: this.locale,
						senderId: messaging.sender.id,
						type,
					};
				}
			}
		} else if (messaging && messaging.postback) {
			const postbackMessaging = messaging as PostBackMessaging;
			const command = JSON.parse(postbackMessaging.postback.payload);
			botRequest = {
				commands: List([{
					features: Map<string, string>(command.features),
					name: command.name,
				}]),
				locale: this.locale,
				message: postbackMessaging.postback.title,
				senderId: messaging.sender.id,
				type: RequestType.TEXT,
			};
		}
		if (isNil(botRequest)) {
			throw new Error('Does not support the request: ' + request);
		}
		return botRequest;
	}

	public response(responses: List<BotResponse>, senderId: string, request?: Request): List<Response> {
		const baseMessage = {
			messaging_type: MessagingType.RESPONSE,
			recipient: {
				id: senderId,
			},
		};
		const facebookResponses = responses
			.toArray()
			.map((response) => {
				let result: Response | undefined;
				if (response.type === ResponseType.TEXT) {
					result = {
						...baseMessage,
						message: {
							text: response.message,
						},
					};
				} else if (response.type === ResponseType.OPTIONS
					&& response.options.length <= 3) {
					result = {
						...baseMessage,
						message: {
							attachment: {
								payload: {
									buttons: response.options.map(option => ({
										payload: JSON.stringify({
											features: option.features,
											name: option.command,
										}),
										title: option.message,
										type: ButtonType.POSTBACK,
									})),
									template_type: ResponseMessageTemplateType.BUTTON,
									text: response.message,
									
								} as ButtonTemplate,
								type: ResponseMessageType.TEMPLATE,
							},
						},
					};
				} else if (response.type === ResponseType.OPTIONS) {
					result = {
						...baseMessage,
						message: {
							quick_replies: response.options.map(option => ({
								content_type: QuickReplyMessageContentType.TEXT,
								payload: JSON.stringify({
									features: option.features,
									name: option.command,
									
								}),
								title: option.message,
							})),
							text: response.message,
						},
					};
				} else if (response.type === ResponseType.ITEMS) {
					result = {
						...baseMessage,
						message: {
							attachment: {
								payload: {
									elements: response.items.map(item => ({
										buttons: [{
											title: item.message,
											type: ButtonType.WEB_URL,
											url: item.url,
										}],
										title: ' ',
									})),
									template_type: ResponseMessageTemplateType.GENERIC,
								} as GenericTemplate,
								type: ResponseMessageType.TEMPLATE,
							} ,
						},
					};
				}
				return result;
			});
		return List<Response>(facebookResponses);
	}

	public async send(
		responses: List<Response>,
		configs: Map<string, Config>): Promise<void> {
		for (const response of responses.toArray()) {
			await req({
				json: response,
				method: 'POST',
				qs: { access_token: configs.get(CONFIG_FACEBOOK_ACCESS_TOKEN).value },
				uri: `${configs.get(CONFIG_FACEBOOK_API_BASE_URL).value as string}/me/messages`,
			});
		}
	}

}

export default FacebookMessenger;
