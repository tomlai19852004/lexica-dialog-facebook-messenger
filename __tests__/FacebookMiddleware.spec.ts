import { Map, List } from 'immutable';
import * as request from 'request-promise-native';
import { createBotServer } from 'lexica-dialog-core/dist/';
import {
	BotServerConfig,
	BotCommand,
	NlpService,
	Middleware,
	IntentMemoryFeatures,
} from 'lexica-dialog-core/dist/Api';
import { configRepository } from 'lexica-dialog-repository';
import { FacebookMessenger, facebookMiddleware } from '../src';

class DummyNlpService implements NlpService {

	async analyse(
		message: string,
		uni: string,
		intentMemoriesFeatures?: List<IntentMemoryFeatures>): Promise<List<BotCommand>> {
		return List<BotCommand>();
	}

}

const config: BotServerConfig = {
	port: 9999,
	mongo: {
		url: 'mongodb://localhost/test',
	},
	redis: {
		url: 'redis://localhost',
	},
	nlpService: new DummyNlpService(),
	messengers: Map({
		'/facebook': new FacebookMessenger('en-GB'),
	}),
	aws: {
		accessKeyId: '',
		secretAccessKey: '',
		region: '',
		s3: {
			apiVersion: 'latest',
			bucket: '',
		},
		transcoder: {
			apiVersion: '',
			delay: 2000,
			maxAttempts: 20,
			audio: {
				pipelineId: '',
				preset: {
					id: '',
					suffix: '',
					contentType: ''
				}
			},
			video: {
				pipelineId: '',
				preset: {
					id: '',
					suffix: '',
					contentType: ''
				}
			}
		},
	},
	preProcessors: Map(),
	postProcessors: Map(),
	executors: Map(),
	middlewares: Map<number, Middleware>({
		250: facebookMiddleware,
	}),
};
const botServer = createBotServer(config);

const verifyToken = 'secret';
const configs = List([{
	uni: 'GLOBAL',
	key: 'SESSION_EXPIRE_IN_MS',
	value: 1000 * 60 * 15,
}, {
	uni: 'GLOBAL',
	key: 'FALLBACK_COMMAND_NAME',
	value: 'C_FALLBACK_MESSAGE',
}, {
	uni: 'GLOBAL',
	key: 'FACEBOOK_VERIFY_TOKEN',
	value: verifyToken,
}]);

beforeAll(async () => {
	botServer.init();
	botServer.redisClient.flushall();
	await botServer.mongoConnection.dropDatabase();
	await Promise.all(configs.toArray().map(config => configRepository.create(config)));
});
afterAll(() => botServer.close());

describe('Facebook middleware subscribe', () => {

	it('should return challenge value', async () => {
		const challenge = '1234567890';
		const response = await request({
			uri: `http://localhost:${config.port}/HKU/facebook`,
			method: 'GET',
			qs: {
				'hub.mode': 'subscribe',
				'hub.verify_token': verifyToken,
				'hub.challenge': challenge,
			},
		});
		expect(response).toBe(challenge);
	});

});

describe('Facebook middleware async', () => {

	it('should return OK immediately', async () => {
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
									"id":"123456"
								},
								"recipient":{
									"id":"PAGE_ID"
								},
								"timestamp":1458692752478,
								"message":{
									"mid":"mid.1457764197618:41d102a3e1ae206a38",
									"text":"Hello"
								}
							}
						]
					}
				]
			}
		`);
		const response = await request({
			uri: `http://localhost:${config.port}/HKU/facebook`,
			method: 'POST',
			json: true,
			body: rawRequest,
		});

		expect(response).toBe('OK');

	});

});
