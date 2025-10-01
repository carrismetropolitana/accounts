/* * */

import { getRandomPersonaImageId } from '@/services/personas.js';
import { type FastifyReply, type FastifyRequest } from '@tmlmobilidade/connectors';
import { HttpStatus } from '@tmlmobilidade/lib';

/* * */

export class PersonasController {
	//

	/**
	 * Retrieves a persona image by ID.
	 * @param request Fastify request
	 * @param reply Fastify reply
	 */
	static async getImageById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply<ReadableStream>) {
		// Persona images are stored in the storage bucket
		const redirectUrl = `https://storage.carrismetropolitana.pt/static/app/assets/personas/${request.params.id}.png`;
		// Redirect to the image URL using a 307 Temporary Redirect status code
		return reply.redirect(redirectUrl, HttpStatus.TEMPORARY_REDIRECT);
	}

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
