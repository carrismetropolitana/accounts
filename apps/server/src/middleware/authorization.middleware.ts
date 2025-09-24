/* * */

import { FastifyRequest } from '@tmlmobilidade/connectors';
import { HttpException, HttpStatus } from '@tmlmobilidade/lib';

/* * */

declare module 'fastify' {
	export interface FastifyRequest {
		device_id: string
	}
}

/* * */

export async function authorizationMiddleware(request: FastifyRequest) {
	// Extract Bearer token from Authorization header
	const authHeader = request.headers.authorization;
	// Validate the presence and format of the token
	if (!authHeader) throw new HttpException(HttpStatus.UNAUTHORIZED, 'Missing Bearer token');
	if (!authHeader.startsWith('Bearer ')) throw new HttpException(HttpStatus.UNAUTHORIZED, 'Invalid Bearer token');
	// Extract the token from the Authorization header
	const token = authHeader.split(' ')[1];
	// Validate the token (this is a placeholder, implement your own logic)
	if (!token) throw new HttpException(HttpStatus.UNAUTHORIZED, 'Invalid authorization token');
	// Attach the token to the request object for downstream handlers
	request.device_id = token;
}
