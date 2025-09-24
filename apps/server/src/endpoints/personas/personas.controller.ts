/* * */

import { getRandomPersonaImageId } from '@/services/personas.js';
import { type FastifyReply, type FastifyRequest } from '@tmlmobilidade/connectors';
import { HttpStatus } from '@tmlmobilidade/lib';
import fs from 'node:fs';

/* * */

export class PersonasController {
	//

	/**
	 * Retrieves a persona image by ID.
	 * @param request Fastify request
	 * @param reply Fastify reply
	 */
	static async getImageById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply<ReadableStream>) {
		// Read the image file from the filesystem
		const fileStream = fs.createReadStream(`/app/dist/public/personas/${request.params.id}.png`);
		// Send the image file as a response
		return reply.type('image/png').send(fileStream);
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
