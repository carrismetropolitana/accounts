/* * */
import { FastifyServerOptions } from 'fastify';

import FastifyService from './services/fastify.service';
import MongooseService from './services/mongoose.service';
import SmartNotificationsService from './services/smart-notifications.service';

/* * */

const options: FastifyServerOptions = {
	ignoreTrailingSlash: true,
	logger: {
		level: 'debug',
		transport: {
			options: {
				colorize: true,
			},
			target: 'pino-pretty',
		},
	},
};

async function main() {
	// Connect to MongoDB
	MongooseService.getInstance(process.env.MONGODB_URI);

	// Connect to Smart Notification Service
	SmartNotificationsService.getInstance(process.env.NOTIFICATIONS_URL);

	// Start Fastify server
	const fastifyService = FastifyService.getInstance(options);
	await fastifyService.start();
}

main();
