import { FastifyRequest } from '@tmlmobilidade/connectors';
import { HttpException, HttpStatus } from '@tmlmobilidade/lib';

declare module 'fastify' {
	export interface FastifyRequest {
		account_id: string
	}
}

export async function authorizationMiddleware(request: FastifyRequest) {
	const authHeader = request.headers.authorization;

	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		throw new HttpException(HttpStatus.UNAUTHORIZED, 'Missing or invalid Bearer token');
	}

	const token = authHeader.split(' ')[1];

	if (!token) {
		throw new HttpException(HttpStatus.UNAUTHORIZED, 'Invalid authorization token');
	}

	request.account_id = token;
}
