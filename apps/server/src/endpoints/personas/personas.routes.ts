/* * */

import { PersonasController } from '@/endpoints/personas/personas.controller.js';
import { FastifyService } from '@tmlmobilidade/connectors';

/* * */

const server = FastifyService.getInstance().server;
const namespace = '/personas';

/* * */

server.register(
	(instance, opts, next) => {
		//

		// GET /
		instance.get('/', PersonasController.getRandomImage);

		next();
	},
	{ prefix: namespace },
);
