import { sessions } from '@tmlmobilidade/interfaces';
import { HttpException, HttpStatus } from '@tmlmobilidade/lib';
import { FastifyReply, FastifyRequest } from 'fastify';

declare module 'fastify' {
	export interface FastifyRequest {
		user_id?: string
	}
}

export default async function authorizationMiddleware(request: FastifyRequest, reply: FastifyReply) {
	const token = request.cookies.session_token;

	if (!token) {
		throw new HttpException(
			HttpStatus.UNAUTHORIZED,
			'Invalid authorization token',
		);
	}

	try {
		const session = await sessions.findOne({ token });

		if (!session) {
			throw new HttpException(HttpStatus.UNAUTHORIZED, 'Session not found');
		}

		request.user_id = session.user_id;
	}
	catch (error) {
		reply
			.status(error.statusCode ?? HttpStatus.INTERNAL_SERVER_ERROR)
			.send({
				message: error.message || 'An unexpected error occurred',
			});
	}
}
