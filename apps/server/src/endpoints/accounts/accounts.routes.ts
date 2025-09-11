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
		instance.get('/persona', AccountsController.getPersona);

		// GET /persona/:id
		instance.get('/persona/:id', AccountsController.getPersonaImageById);

		// GET /accounts
		instance.get('/', { preHandler: authorizationMiddleware }, AccountsController.getByUserId);

		// POST /accounts (Sync)
		instance.post('/', { preHandler: authorizationMiddleware }, AccountsController.sync);

		// DELETE /accounts/
		instance.delete('/', { preHandler: authorizationMiddleware }, AccountsController.delete);

		next();
	},
	{ prefix: namespace },
);
