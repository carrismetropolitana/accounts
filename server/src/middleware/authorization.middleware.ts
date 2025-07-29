import { Account } from '@/interfaces/account.type';
import { accounts } from '@/interfaces/accounts.interface';
import { WithId } from '@tmlmobilidade/interfaces';
import { HttpException, HttpStatus } from '@tmlmobilidade/lib';
import { FastifyReply, FastifyRequest } from 'fastify';

declare module 'fastify' {
	export interface FastifyRequest {
		account: WithId<Account>
	}
}

export default async function authorizationMiddleware(request: FastifyRequest, reply: FastifyReply) {
	const token = request.headers.authorization?.split(' ')[1];

	if (!token) {
		throw new HttpException(HttpStatus.UNAUTHORIZED, 'Invalid authorization token');
	}

	try {
		const account = await accounts.findByDeviceId(token);

		if (!account) {
			throw new HttpException(HttpStatus.UNAUTHORIZED, 'Account not found');
		}

		request.account = account;
	}
	catch (error) {
		reply
			.status(error.statusCode ?? HttpStatus.INTERNAL_SERVER_ERROR)
			.send({
				message: error.message || 'An unexpected error occurred',
			});
	}
}
