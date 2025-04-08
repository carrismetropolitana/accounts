/* * */

import FastifyService from '@/services/fastify.service.js';
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

/* * */

const server: FastifyInstance = FastifyService.getInstance().server;
const namespace = '/public';

/* * */

server.register(
	(instance, opts, next) => {
		// GET /accounts
		instance.get(
			'/:id',
			(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply,) => {
                const { id } = request.params;
				return reply.sendFile(`/output/${id}`);
            }
		);

		next();
	},
	{ prefix: namespace },
);
