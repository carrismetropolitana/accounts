/* * */

import { AccountsController } from '@/endpoints/accounts/accounts.controller.js';
import { authorizationMiddleware } from '@/middleware/authorization.middleware.js';
import { FastifyService } from '@tmlmobilidade/connectors';

/* * */

const server = FastifyService.getInstance().server;
const namespace = '/accounts';

/* * */

server.register(
	(instance, opts, next) => {
		//

		// GET /accounts
		instance.get('/', { preHandler: authorizationMiddleware }, AccountsController.get);

		// POST /accounts
		instance.get('/new', { preHandler: authorizationMiddleware }, AccountsController.create);

		// PUT /accounts
		instance.put('/', { preHandler: authorizationMiddleware }, AccountsController.update);

		// DELETE /accounts
		instance.delete('/', { preHandler: authorizationMiddleware }, AccountsController.delete);

		next();
	},
	{ prefix: namespace },
);
