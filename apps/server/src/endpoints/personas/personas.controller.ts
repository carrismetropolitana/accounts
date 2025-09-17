/* * */

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
	static async getImageById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply<void>) {
		return reply.sendFile(`/app/dist/public/personas/${request.params.id}`);
	}

	/**
	 * Retrieves a random persona image.
	 * @param request Fastify request
	 * @param reply Fastify reply
	 */
	static async getRandomImage(request: FastifyRequest, reply: FastifyReply<{ id: string, url: string }>) {
		const imagesDir = '/app/dist/public/personas';
		const availableImages = fs.readdirSync(imagesDir);
		const randomIndex = Math.floor(Math.random() * availableImages.length);
		const randomSelection = availableImages[randomIndex];
		return reply.send({ data: { id: randomSelection, url: randomSelection }, error: null, statusCode: HttpStatus.OK });
	}

	//
}
