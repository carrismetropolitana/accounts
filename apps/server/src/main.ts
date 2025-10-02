/* * */

import { FastifyService, type FastifyServiceOptions } from '@tmlmobilidade/connectors';

/* * */

const MAX_BODY_SIZE = 1024 * 1024 * 10; // 10MB

const options: FastifyServiceOptions = {
	bodyLimit: MAX_BODY_SIZE,
	// logger: {
	// 	level: 'debug',
	// 	transport: {
	// 		options: {
	// 			colorize: true,
	// 		},
	// 		target: 'pino-pretty',
	// 	},
	// },
	port: 5050,
	routerOptions: {
		ignoreTrailingSlash: true,
		maxParamLength: 200,
	},
};

async function main() {
	const fastifyService = FastifyService.getInstance(options);
	await fastifyService.start();
}

main();
