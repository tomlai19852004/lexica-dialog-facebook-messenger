enum FileType {
	AUDIO = 'audio',
	FALLBACK = 'fallback',
	FILE = 'file',
	IMAGE = 'image',
	LOCATION = 'location',
	VIDEO = 'video',
}

enum ResponseMessageType {
	AUDIO = 'audio',
	FILE = 'file',
	IMAGE = 'image',
	VIDEO = 'video',
	TEMPLATE = 'template',
}

enum ResponseMessageTemplateType {
	BUTTON = 'button',
	GENERIC = 'generic',
}

enum ButtonType {
	WEB_URL = 'web_url',
	POSTBACK = 'postback',
}

enum WebUrlButtonWebviewHeightRatio {
	COMPACT = 'compact',
	TALL = 'tall',
	FULL = 'full',
}

enum QuickReplyMessageContentType {
	TEXT = 'text',
	LOCATION = 'location',
}

// https://developers.facebook.com/docs/messenger-platform/send-messages#messaging_types
enum MessagingType {
	RESPONSE = 'RESPONSE',
	UPDATE = 'UPDATE',
	MESSAGE_TAG = 'MESSAGE_TAG',
	NON_PROMOTIONAL_SUBSCRIPTION = 'NON_PROMOTIONAL_SUBSCRIPTION',
}

// Request

interface BaseRequestMessaging {
	sender: {
		id: string;
	};
	recipient: {
		id: string;
	};
	timestamp: number;
}

interface TextRequestMessaging extends BaseRequestMessaging {
	message: {
		mid: string;
		text: string;
		quick_reply?: {
			payload: string;
		};
	};
}

interface FileRequestMessaging extends BaseRequestMessaging {
	message: {
		mid: string;
		attachments: Array<{
			type: FileType.AUDIO
				| FileType.FILE
				| FileType.IMAGE
				| FileType.VIDEO,
			payload: {
				url: string;
			};
		}>;
	};
}

interface LocationRequestMessaging extends BaseRequestMessaging {
	message: {
		mid: string;
		attachments: Array<{
			type: FileType.LOCATION
			payload: {
				coordinates: {
					lat: number;
					long: number;
				};
			};
		}>;
	};
}

interface FallbackRequestMessaging extends BaseRequestMessaging {
	message: {
		mid: string;
		text: string;
		attachments: Array<{
			type: FileType.FALLBACK;
			title: string;
			url: string;
		}>;
	};
}

interface PostBackMessaging {
	postback: {
		title: string;
		payload: string;
		referral?: {
			ref: string;
			source: string;
			type: string;
		};
	};
}

type RequestMessaging = TextRequestMessaging
	| FileRequestMessaging
	| LocationRequestMessaging
	| FallbackRequestMessaging
	| PostBackMessaging;

interface Request {
	object: string;
	entry: Array<{
		id: string;
		time: number;
		messaging: RequestMessaging[];
	}>;
}

// Response

interface TextResponseMessage {
	text: string;
}

interface FileResponseMessage {
	attachment: {
		type: ResponseMessageType.AUDIO
			| ResponseMessageType.FILE
			| ResponseMessageType.IMAGE
			| ResponseMessageType.VIDEO;
		payload: {
			url: string;
		};
	};
}

interface PostBackButton {
	type: ButtonType.POSTBACK;
	title: string;
	payload: string;
}

interface WebUrlButton {
	type: ButtonType.WEB_URL;
	url: string;
	title: string;
	webview_height_ratio?: WebUrlButtonWebviewHeightRatio;
	messenger_extensions?: boolean;
	fallback_url?: string;
}

type Button = WebUrlButton | PostBackButton;

interface ButtonTemplate {
	template_type: ResponseMessageTemplateType.BUTTON;
	text: string;
	buttons: Button[];
}

interface GenericTemplate {
	template_type: ResponseMessageTemplateType.GENERIC;
	elements: Array<{
		title: string;
		subtitle?: string;
		image_url?: string;
		default_action?: Button;
		buttons?: Button[];
	}>;
}

interface TemplateResponseMessage {
	attachment: {
		type: ResponseMessageType.TEMPLATE;
		payload: ButtonTemplate | GenericTemplate;
	};
}

interface BaseQuickReply {
	content_type: QuickReplyMessageContentType;
	title?: string;
	payload?: string;
	image_url?: string;
}

interface TextQuickReply extends BaseQuickReply {
	content_type: QuickReplyMessageContentType.TEXT;
	title: string;
	payload: string;
}

interface LocationQuickReply extends BaseQuickReply {
	content_type: QuickReplyMessageContentType.LOCATION;
}

type QuickReply = TextQuickReply | LocationQuickReply;

interface QuickReplyMessage {
	text: string;
	quick_replies: QuickReply[];
}

type ResponseMessage = TextResponseMessage
	| FileResponseMessage
	| TemplateResponseMessage
	| QuickReplyMessage;

interface Response {
	recipient: {
		id: string;
	};
	message: ResponseMessage;
	messaging_type: MessagingType;
	tag?: string;
}


export {
	FileType,
	ResponseMessageType,
	ResponseMessageTemplateType,
	ButtonType,
	WebUrlButtonWebviewHeightRatio,
	QuickReplyMessageContentType,
	MessagingType,
	BaseRequestMessaging,
	TextRequestMessaging,
	FileRequestMessaging,
	LocationRequestMessaging,
	FallbackRequestMessaging,
	PostBackMessaging,
	RequestMessaging,
	Request,
	TextResponseMessage,
	FileResponseMessage,
	PostBackButton,
	WebUrlButton,
	Button,
	ButtonTemplate,
	GenericTemplate,
	TemplateResponseMessage,
	BaseQuickReply,
	TextQuickReply,
	LocationQuickReply,
	QuickReply,
	QuickReplyMessage,
	ResponseMessage,
	Response,
};
