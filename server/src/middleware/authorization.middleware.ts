import { sessions } from '@tmlmobilidade/interfaces';
import { HttpException, HttpStatus } from '@tmlmobilidade/lib';
import { FastifyReply, FastifyRequest } from 'fastify';

export default async function authorizationMiddleware(request: FastifyRequest, reply: FastifyReply) {
	const token = request.cookies.session_token;

	if (!token) {
		throw new HttpException(
			HttpStatus.UNAUTHORIZED,
			'Invalid authorization token',
		);
	}

	try {
		// TODO: Implement caching with redis

		const session = await sessions.findOne({ token });

		if (!session) {
			throw new HttpException(HttpStatus.UNAUTHORIZED, 'Session not found');
		}
	}
	catch (error) {
		reply
			.status(error.statusCode ?? HttpStatus.INTERNAL_SERVER_ERROR)
			.send({
				message: error.message || 'An unexpected error occurred',
			});
	}
}
