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

		// GET /accounts/favorites/cicm
		instance.get('/favorites/cicm', { preHandler: authorizationMiddleware }, AccountsController.getCicmFavorites);

		// PUT /accounts/favorites/cicm/import
		instance.put('/favorites/cicm/import', { preHandler: authorizationMiddleware }, AccountsController.importCicmFavorites);

		// PUT /accounts/favorites/cicm/:contentType/:contentId
		instance.put('/favorites/cicm/:contentType/:contentId', { preHandler: authorizationMiddleware }, AccountsController.addCicmFavorite);

		// DELETE /accounts/favorites/cicm/:contentType/:contentId
		instance.delete('/favorites/cicm/:contentType/:contentId', { preHandler: authorizationMiddleware }, AccountsController.removeCicmFavorite);

		// PUT /accounts
		instance.put('/', { preHandler: authorizationMiddleware }, AccountsController.update);

		// DELETE /accounts
		instance.delete('/', AccountsController.delete);

		next();
	},
	{ prefix: namespace },
);
