import { HttpStatus } from '@tmlmobilidade/lib';
import { FastifyReply, FastifyRequest } from 'fastify';
import { accounts } from '@/interfaces/accounts.interface.js';
import { CreateAccountDto } from '@/interfaces/account.type.js';

/**
 * This is an example controller that is using the accounts interface.
 */
export class AccountsController {
	/**
	 * Creates a new account
	 * @param request Fastify request containing account data in body
	 * @param reply Fastify reply
	 */
	static async create(request: FastifyRequest<{ Body: CreateAccountDto }>, reply: FastifyReply) {
		try {
			const account = await accounts.insertOne(request.body);
			return reply.status(HttpStatus.CREATED).send(account);
		}
		catch (error) {
			return reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send(error);
		}
	}

	/**
	 * Deletes an account by ID
	 * @param request Fastify request containing account ID in params
	 * @param reply Fastify reply
	 */
	static async delete(
		request: FastifyRequest<{ Params: { id: string } }>,
		reply: FastifyReply,
	) {
		try {
			const account = await accounts.deleteOne({ devices: { $elemMatch: { device_id: request.params.id } } });
			return reply.status(HttpStatus.OK).send(account);
		}
		catch (error) {
			return reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send(error);
		}
	}

	/**
	 * Retrieves all accounts, sorted by creation date descending
	 * @param request Fastify request
	 * @param reply Fastify reply
	 */
	static async getAll(request: FastifyRequest, reply: FastifyReply) {
		try {
			const all = await accounts.all();
			return reply.status(HttpStatus.OK).send(all);
		}
		catch (error) {
			return reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send(error);
		}
	}

	/**
	 * Retrieves an account by device ID
	 * @param request Fastify request containing device ID in params
	 * @param reply Fastify reply
	 */
	static async getByDeviceId(
		request: FastifyRequest<{ Params: { id: string } }>,
		reply: FastifyReply,
	) {
		try {
			const account = await accounts.findByDeviceId(request.params.id);
			return reply.status(HttpStatus.OK).send(account);
		}
		catch (error) {
			return reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send(error);
		}
	}

	/**
	 * Updates an existing account by ID
	 * @param request Fastify request containing account ID in params and update data in body
	 * @param reply Fastify reply
	 */
	static async update(
		request: FastifyRequest<{ Params: { id: string } }>,
		reply: FastifyReply,
	) {
		try {
			const account = await accounts.updateOne({ devices: { $elemMatch: { device_id: request.params.id } } }, request.body);
			return reply.status(HttpStatus.OK).send(account);
		}
		catch (error) {
			return reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send(error);	
		}
	}
}
