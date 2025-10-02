/* * */

import { getRandomPersonaImageId } from '@/services/personas.js';
import { type FastifyReply, type FastifyRequest } from '@tmlmobilidade/connectors';
import { HttpStatus } from '@tmlmobilidade/lib';

/* * */

export class PersonasController {
	//

	/**
	 * Retrieves a random persona image.
	 * @param request Fastify request
	 * @param reply Fastify reply
	 */
	static async getRandomImage(request: FastifyRequest, reply: FastifyReply<string>) {
		const randomSelectionId = getRandomPersonaImageId();
		return reply.send({ data: randomSelectionId, error: null, statusCode: HttpStatus.OK });
	}

	//
}
