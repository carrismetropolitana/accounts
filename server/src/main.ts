/* * */

import fastifyStatic from '@fastify/static';
import { FastifyService, FastifyServiceOptions } from '@tmlmobilidade/connectors';
import path from 'path';

import PatternService from './services/pattern.service';
import ShapeService from './services/shape.service';
import StopsService from './services/stops.service';

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
};

async function main() {
	// Start Services
	StopsService.getInstance(process.env.CMET_API_URL as string + '/stops');
	PatternService.getInstance(process.env.CMET_API_URL as string + '/patterns');
	ShapeService.getInstance(process.env.CMET_API_URL as string + '/shapes');

	// Start Fastify server
	const fastifyService = FastifyService.getInstance(options);

	await fastifyService.server.register(fastifyStatic, {
		root: path.join(__dirname, '../public'),
	});

	await fastifyService.start();
}

main();
