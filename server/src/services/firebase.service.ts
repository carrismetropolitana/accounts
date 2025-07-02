import { credential } from 'firebase-admin';
import { App, initializeApp } from 'firebase-admin/app';
import {
	getMessaging,
	Messaging,
	TopicMessage,
} from 'firebase-admin/messaging';

interface NotificationPayload {
	body: string
	data?: Record<string, string>
	title: string
}

export default class FirebaseService {
	private static instance: FirebaseService;
	private app: App;
	private messaging: Messaging;

	private constructor() {
		this.app = initializeApp({
			credential: credential.cert(process.env.FIREBASE_CREDENTIALS_PATH),
		});
		this.messaging = getMessaging(this.app);
	}

	public static getInstance() {
		if (!FirebaseService.instance) {
			FirebaseService.instance = new FirebaseService();
		}
		return FirebaseService.instance;
	}

	public async sendNotification(topic: string, payload: NotificationPayload): Promise<{ messageId: string }> {
		const message: TopicMessage = {
			android: {
				notification: {
					body: payload.body,
					sound: 'default',
					title: payload.title,
				},
				priority: 'high',
			},
			apns: {
				headers: {
					'apns-priority': '10',
				},
				payload: {
					aps: {
						'alert': {
							body: payload.body,
							title: payload.title,
						},
						'content-available': 1,
						'sound': 'default',
					},
				},
			},
			data: {
				test: 'true',
			},
			notification: {
				body: payload.body,
				title: payload.title,
			},
			topic,
		};

		const messageId = await this.messaging.send(message);
		return { messageId };
	}
}
