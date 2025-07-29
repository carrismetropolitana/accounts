/* * */

import authorizationMiddleware from '@/middleware/authorization.middleware.js';
import { FastifyService } from '@tmlmobilidade/connectors';

import { AccountsController } from './accounts.controller.js';

/* * */

const server = FastifyService.getInstance().server;
const namespace = '/accounts';

/* * */

server.register(
	(instance, opts, next) => {
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

		// GET /accounts
		instance.get(
			'/',
			{
				preHandler: authorizationMiddleware,
			},
			AccountsController.getByUserId,
		);

		// POST /accounts
		instance.post(
			'/',
			{
				preHandler: authorizationMiddleware,
			},
			AccountsController.getByUserId,
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
