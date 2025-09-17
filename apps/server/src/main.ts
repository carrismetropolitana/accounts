/* * */

import fastifyStatic from '@fastify/static';
import { FastifyService, FastifyServiceOptions } from '@tmlmobilidade/connectors';
import path from 'path';

/* * */

const MAX_BODY_SIZE = 1024 * 1024 * 10; // 10MB

const options: FastifyServiceOptions = {
	bodyLimit: MAX_BODY_SIZE,
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
	maxParamLength: 200,
	port: 5050,
};

async function main() {
	const fastifyService = FastifyService.getInstance(options);
	await fastifyService.server.register(fastifyStatic, {
		root: path.join(__dirname, '../public'),
	});
	await fastifyService.start();
}

main();
