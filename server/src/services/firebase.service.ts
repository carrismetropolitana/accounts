import { credential } from 'firebase-admin';
import { App, initializeApp } from 'firebase-admin/app';
import { getMessaging, Messaging, Notification } from 'firebase-admin/messaging';

/* * */

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

	public async sendNotification(topic: string, payload: Notification) {
		return await this.messaging.send({
			notification: payload,
			topic,
		});
	}
}
