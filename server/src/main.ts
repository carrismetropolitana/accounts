/* * */

import FastifyService from '@/services/fastify.service.js';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import fastifyMultipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import { FastifyServerOptions } from 'fastify';
import path from 'path';

import PatternService from './services/pattern.service';
import ShapeService from './services/shape.service';
import StopsService from './services/stops.service';

/* * */

const MAX_BODY_SIZE = 1024 * 1024 * 10; // 10MB

const options: FastifyServerOptions = {
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
	await fastifyService.server.register(fastifyMultipart, {
		limits: {
			fileSize: MAX_BODY_SIZE,
		},
	});
	await fastifyService.server.register(cookie);

	// Setup CORS
	const origin
		= process.env.NODE_ENV === 'development'
			? true
			: `https://*.${process.env.COOKIE_DOMAIN}`;

	await fastifyService.server.register(cors, {
		credentials: true,
		origin,
	});

	// Setup Public

	await fastifyService.server.register(fastifyStatic, {
		root: path.join(__dirname, '../public'),
	});

	await fastifyService.start();
}

main();
