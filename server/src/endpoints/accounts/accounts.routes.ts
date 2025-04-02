/* * */

import authorizationMiddleware from '@/middleware/authorization.middleware.js';
import FastifyService from '@/services/fastify.service.js';
import { FastifyInstance } from 'fastify';

import { AccountsController } from './accounts.controller.js';

/* * */

const server: FastifyInstance = FastifyService.getInstance().server;
const namespace = '/accounts';

/* * */

server.register(
	(instance, opts, next) => {
		// GET /accounts
		instance.get(
			'/',
			{
				preHandler: authorizationMiddleware,
			},
			AccountsController.getAll,
		);

		// GET /accounts/:id
		instance.get(
			'/:id',
			{
				preHandler: authorizationMiddleware,
			},
			AccountsController.getById,
		);

		// POST /accounts
		instance.post(
			'/',
			{
				preHandler: authorizationMiddleware,
			},
			AccountsController.create,
		);

		// PUT /accounts/:id
		instance.put(
			'/:id',
			{
				preHandler: authorizationMiddleware,
			},
			AccountsController.update,
		);

		// DELETE /accounts/:id
		instance.delete(
			'/:id',
			{
				preHandler: authorizationMiddleware,
			},
			AccountsController.delete,
		);

		next();
	},
	{ prefix: namespace },
);
