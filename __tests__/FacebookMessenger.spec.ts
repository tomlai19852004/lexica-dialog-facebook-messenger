import { Map, List } from 'immutable';
import {
	TextResponse,
	OptionsResponse,
	ItemsResponse,
	ResponseType,
} from 'lexica-dialog-model/dist/Message';
import { RequestType } from 'lexica-dialog-core/dist/Api';
import { Config } from 'lexica-dialog-model/dist/Config';
import { FacebookMessenger } from '../src';
import {
	TextResponseMessage,
	TemplateResponseMessage,
	ResponseMessageType,
	ResponseMessageTemplateType,
	QuickReplyMessage,
	ButtonTemplate,
	ButtonType,
	PostBackButton,
	GenericTemplate,
	FileType,
	QuickReplyMessageContentType,
	MessagingType,
} from '../src/Types';

jest.mock('request-promise-native');

import * as request from 'request-promise-native';

const locale = 'en-GB';
const senderId = '123456789';
const enGbFacebookMessenger = new FacebookMessenger(locale);

const runFileTypeRequest = (fileType: FileType, requestType: RequestType) => {

	const url = 'http://lexica.io';
	const rawRequest = JSON.parse(`
		{
			"object":"page",
			"entry":[
				{
					"id":"PAGE_ID",
					"time":1458692752478,
					"messaging":[
						{
							"sender":{
								"id":"${senderId}"
							},
							"recipient":{
								"id":"PAGE_ID"
							},
							"timestamp":1458692752478,
							"message":{
								"mid":"mid.1457764197618:41d102a3e1ae206a38",
								"attachments":[
									{
										"type":"${fileType}",
										"payload":{
											"url":"${url}"
										}
									}
								]
							}
						}
					]
				}
			]
		}
	`);

	const botRequest = enGbFacebookMessenger.request(rawRequest);
	expect(botRequest).not.toBeNull();
	expect(botRequest).toBeDefined();
	expect(botRequest.type).toBe(requestType);
	expect(botRequest.locale).toBe(locale);
	expect(botRequest.senderId).toBe(senderId);
	expect(botRequest.message).toBeUndefined();
	expect(botRequest.fileUrl).toBe(url);
};

describe('Facebook Messenger Request', () => {

	it('should extract message and sender ID', () => {

		const message = 'Hello Lexica.';
		const rawRequest = JSON.parse(`
			{
				"object":"page",
				"entry":[
					{
						"id":"PAGE_ID",
						"time":1458692752478,
						"messaging":[
							{
								"sender":{
									"id":"${senderId}"
								},
								"recipient":{
									"id":"PAGE_ID"
								},
								"timestamp":1458692752478,
								"message":{
									"mid":"mid.1457764197618:41d102a3e1ae206a38",
									"text":"${message}"
								}
							}
						]
					}
				]
			}
		`);
		const botRequest = enGbFacebookMessenger.request(rawRequest);

		expect(botRequest).not.toBeNull();
		expect(botRequest).not.toBeUndefined();
		expect(botRequest.type).toBe(RequestType.TEXT);
		expect(botRequest.locale).toBe(locale);
		expect(botRequest.senderId).toBe(senderId);
		expect(botRequest.message).toBe(message);

	});

	it('should extract message, sender ID and command', () => {

		const message = 'Hello Lexica.';
		const commandName = 'GREETING';
		const featureKey = 'F_NAME';
		const featureValue = 'Lawrence';
		const commandPayload = JSON.stringify(JSON.parse(`
			{
				"name": "${commandName}",
				"features": {
					"${featureKey}": "${featureValue}"
				}
			}
		`));
		const rawRequest = JSON.parse(`
			{
				"object":"page",
				"entry":[
					{
						"id":"PAGE_ID",
						"time":1458692752478,
						"messaging":[
							{
								"sender":{
									"id":"${senderId}"
								},
								"recipient":{
									"id":"PAGE_ID"
								},
								"timestamp":1458692752478,
								"message":{
									"mid":"mid.1457764197618:41d102a3e1ae206a38",
									"text":"${message}",
									"quick_reply": {
										"payload": "${commandPayload.replace(/"/g, '\\"')}"
									}
								}
							}
						]
					}
				]
			}
		`);
		const botRequest = enGbFacebookMessenger.request(rawRequest);

		expect(botRequest).not.toBeNull();
		expect(botRequest).toBeDefined();
		expect(botRequest.type).toBe(RequestType.TEXT);
		expect(botRequest.locale).toBe(locale);
		expect(botRequest.senderId).toBe(senderId);
		expect(botRequest.message).toBe(message);
		expect(botRequest.commands).not.toBeUndefined();
		// expect(botRequest.commands.size).toBe(1);
		// expect(botRequest.commands.first().name).toBe(commandName);
		// expect(botRequest.commands.first().features).not.toBeUndefined();
		// expect(botRequest.commands.first().features.has(featureKey)).toBe(true);
		// expect(botRequest.commands.first().features.get(featureKey)).toBe(featureValue);
	});

	it('should return image type request', () => {
		runFileTypeRequest(FileType.IMAGE, RequestType.IMAGE);
	});

	it('should return audio type request', () => {
		runFileTypeRequest(FileType.AUDIO, RequestType.AUDIO);
	});

	it('should return video type request', () => {
		runFileTypeRequest(FileType.VIDEO, RequestType.VIDEO);
	});

	it('should return file type request', () => {
		runFileTypeRequest(FileType.FILE, RequestType.FILE);
	});

});


describe('Facebook Messenger Response', () => {

	it('should return text response', () => {

		const message = 'Hello, I am Lexica.';
		const textResponses = List<TextResponse>([{
			message,
			type: ResponseType.TEXT,
		}]);
		const facebookResponses = enGbFacebookMessenger.response(textResponses, senderId);

		expect(facebookResponses).not.toBeNull();
		expect(facebookResponses).toBeDefined();
		expect(facebookResponses.size).toBe(1);
		expect(facebookResponses.first()).toHaveProperty('recipient');
		expect(facebookResponses.first().recipient).toHaveProperty('id');
		expect(facebookResponses.first().recipient.id).toBe(senderId);
		expect(facebookResponses.first()).toHaveProperty('messaging_type');
		expect(facebookResponses.first().messaging_type).toBe(MessagingType.RESPONSE);
		expect(facebookResponses.first()).toHaveProperty('message');
		expect(facebookResponses.first().message).toHaveProperty('text');
		expect((<TextResponseMessage>facebookResponses.first().message).text).toBe(message);

	});

	it('should return button template response', () => {

		const options = ['A', 'B', 'C']
			.map(option => ({
				command: `C_COMMAND_${option}`,
				features: {
					F_NAME: option,
				},
				message: option,
				textOnlyIndicator: option,
			}));
		const optionResponses = List<OptionsResponse>([{
			options,
			message: 'Select below item',
			type: ResponseType.OPTIONS,
		}]);
		const facebookResponses = enGbFacebookMessenger.response(optionResponses, senderId);

		expect(facebookResponses).not.toBeNull();
		expect(facebookResponses).toBeDefined();
		expect(facebookResponses.size).toBe(1);
		expect(facebookResponses.first()).toHaveProperty('recipient');
		expect(facebookResponses.first().recipient).toHaveProperty('id');
		expect(facebookResponses.first().recipient.id).toBe(senderId);
		expect(facebookResponses.first()).toHaveProperty('messaging_type');
		expect(facebookResponses.first().messaging_type).toBe(MessagingType.RESPONSE);
		expect(facebookResponses.first()).toHaveProperty('message');
		expect(facebookResponses.first().message).toHaveProperty('attachment');
		expect(facebookResponses.first().message).toHaveProperty('attachment.type');

		const templateResponse = (<TemplateResponseMessage>facebookResponses.first().message);

		expect(templateResponse.attachment).toHaveProperty('type');
		expect(templateResponse.attachment).toHaveProperty('payload');
		expect(templateResponse.attachment.type).toBe(ResponseMessageType.TEMPLATE);
		expect(templateResponse.attachment.payload.template_type)
			.toBe(ResponseMessageTemplateType.BUTTON);

		const buttonTemplate = (<ButtonTemplate>templateResponse.attachment.payload);
		expect(buttonTemplate.text).toBe(optionResponses.first().message);
		expect(buttonTemplate.buttons).toHaveLength(options.length);
		buttonTemplate.buttons.forEach((button, index) => {
			const option = options[index];
			expect(button.type).toBe(ButtonType.POSTBACK);
			expect(button.title).toBe(option.message);
			expect(button).toHaveProperty('payload');
			const postbackButton = (<PostBackButton>button);
			expect(JSON.parse(postbackButton.payload)).toEqual({
				name: option.command,
				features: option.features,
			});
		});

	});

	it('should return quick replies response', () => {

		const options = ['A', 'B', 'C', 'D', 'E']
			.map(option => ({
				command: `C_COMMAND_${option}`,
				features: {
					F_NAME: option,
				},
				message: option,
				textOnlyIndicator: option,
			}));
		const optionResponses = List<OptionsResponse>([{
			options,
			message: 'Select below item',
			type: ResponseType.OPTIONS,
		}]);
		const facebookResponses = enGbFacebookMessenger.response(optionResponses, senderId);

		expect(facebookResponses).not.toBeNull();
		expect(facebookResponses).toBeDefined();
		expect(facebookResponses.size).toBe(1);
		expect(facebookResponses.first()).toHaveProperty('recipient');
		expect(facebookResponses.first().recipient).toHaveProperty('id');
		expect(facebookResponses.first().recipient.id).toBe(senderId);
		expect(facebookResponses.first()).toHaveProperty('messaging_type');
		expect(facebookResponses.first().messaging_type).toBe(MessagingType.RESPONSE);
		expect(facebookResponses.first()).toHaveProperty('message');
		expect(facebookResponses.first().message).toHaveProperty('text');
		expect(facebookResponses.first().message).toHaveProperty('quick_replies');

		const quickReplyMessage = (<QuickReplyMessage>facebookResponses.first().message);

		expect(quickReplyMessage).toHaveProperty('text');
		expect(quickReplyMessage).toHaveProperty('quick_replies');

		expect(quickReplyMessage.quick_replies).toHaveLength(options.length);
		quickReplyMessage.quick_replies.forEach((quickReply, index) => {
			const option = options[index];
			expect(quickReply).toHaveProperty('content_type');
			expect(quickReply).toHaveProperty('payload');
			expect(quickReply.content_type).toBe(QuickReplyMessageContentType.TEXT);
			expect(quickReply.title).toBe(option.message);
		});

	});

	it('should return generic template response', () => {

		// items:
		const items = ['A'].map(item => ({
			type: 'image',
			url: 'https://lexica.io/${item}',
			message: item,
		}));
		const optionResponses = List<ItemsResponse>([{
			items,
			type: ResponseType.ITEMS,
		}]);
		const facebookResponses = enGbFacebookMessenger.response(optionResponses, senderId);

		expect(facebookResponses).not.toBeNull();
		expect(facebookResponses).toBeDefined();
		expect(facebookResponses.size).toBe(1);
		expect(facebookResponses.first()).toHaveProperty('recipient');
		expect(facebookResponses.first().recipient).toHaveProperty('id');
		expect(facebookResponses.first().recipient.id).toBe(senderId);
		expect(facebookResponses.first()).toHaveProperty('messaging_type');
		expect(facebookResponses.first().messaging_type).toBe(MessagingType.RESPONSE);
		expect(facebookResponses.first()).toHaveProperty('message');
		expect(facebookResponses.first().message).toHaveProperty('attachment');
		expect(facebookResponses.first().message).toHaveProperty('attachment.type');

		const templateResponse = (<TemplateResponseMessage>facebookResponses.first().message);
		expect(templateResponse.attachment).toHaveProperty('type');
		expect(templateResponse.attachment).toHaveProperty('payload');
		expect(templateResponse.attachment.type).toBe(ResponseMessageType.TEMPLATE);
		expect(templateResponse.attachment.payload.template_type)
			.toBe(ResponseMessageTemplateType.GENERIC);

		const genericTemplate = (<GenericTemplate>templateResponse.attachment.payload);

		genericTemplate.elements.forEach((element, index) => {
			const item = items[index];
			expect(element.title).toBe(' ');
			expect(element.buttons).toHaveLength(1);
			// expect(element.buttons[0]).toEqual({
			// 	type: ButtonType.WEB_URL,
			// 	url: item.url,
			// 	title: item.message,
			// });
		});

	});
});


describe('Facebook Messenger Send', () => {

	it('should call facebook API to send message', async () => {
		const message = 'Hello, I am Lexica.';
		const facebookToken = 'abcdefg';
		const textResponses = List<TextResponse>([{
			message,
			type: ResponseType.TEXT,
		}]);
		const facebookResponses = enGbFacebookMessenger.response(textResponses, senderId);
		const apiBaseUrl = 'https://graph.facebook.com/v2.10';
		const configs = Map<string, Config>({
			FACEBOOK_ACCESS_TOKEN: {
				key: 'FACEBOOK_ACCESS_TOKEN',
				value: facebookToken,
			},
			FACEBOOK_API_BASE_URL: {
				key: 'FACEBOOK_API_BASE_URL',
				value: apiBaseUrl,
			},
		});
		await enGbFacebookMessenger.send(facebookResponses, configs);
		expect(request).toBeCalled();
		expect(request).toBeCalledWith({
			uri: apiBaseUrl + '/me/messages',
			qs: { access_token: facebookToken },
			method: 'POST',
			json: facebookResponses.first(),
		});
	});

});
