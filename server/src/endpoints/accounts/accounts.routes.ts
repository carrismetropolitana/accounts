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
			'/all',
			{
				preHandler: authorizationMiddleware,
			},
			AccountsController.getAll,
		);

		// GET /accounts/
		instance.get(
			'/',
			{
				preHandler: authorizationMiddleware,
			},
			AccountsController.getByUserId,
		);

		// GET /persona
		instance.get(
			'/persona',
			{
				// preHandler: authorizationMiddleware,
			},
			AccountsController.getPersona,
		);

		// GET /persona/:id
		instance.get(
			'/persona/:id',
			{
				// preHandler: authorizationMiddleware,
			},
			AccountsController.getPersonaImageById,
		);

		// POST /accounts
		instance.post(
			'/',
			AccountsController.create,
		);

		// PUT /accounts/
		instance.put(
			'/',
			{
				preHandler: authorizationMiddleware,
			},
			AccountsController.update,
		);

		// POST /accounts//smart-notification
		instance.post(
			'/smart-notifications',
			{
				preHandler: authorizationMiddleware,
			},
			AccountsController.createSmartNotification,
		);

		// DELETE /accounts/
		instance.delete(
			'/',
			{
				preHandler: authorizationMiddleware,
			},
			AccountsController.delete,
		);

		next();
	},
	{ prefix: namespace },
);
