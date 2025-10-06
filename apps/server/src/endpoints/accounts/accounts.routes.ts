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

		// GET /accounts/new
		instance.get('/new', AccountsController.create);

		// PUT /accounts
		instance.put('/', { preHandler: authorizationMiddleware }, AccountsController.update);

		// DELETE /accounts
		instance.delete('/', AccountsController.delete);

		next();
	},
	{ prefix: namespace },
);
