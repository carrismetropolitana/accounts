/* * */

import { accounts } from '@carrismetropolitana/accounts-interfaces';
import { type Account, AccountSchema } from '@carrismetropolitana/accounts-types';
import { type FastifyReply, type FastifyRequest } from '@tmlmobilidade/connectors';
import { HttpException, HttpStatus } from '@tmlmobilidade/lib';
import { Dates, generateRandomToken } from '@tmlmobilidade/utils';

/* * */

export class AccountsController {
	//

	/**
	 * Create a new empty account with a random Account ID.
	 * @param request Fastify request
	 * @param reply Fastify reply
	 */
	static async create(request: FastifyRequest, reply: FastifyReply<{ device_id: string }>) {
		// Generate a random Device ID
		let randomDeviceId = generateRandomToken();
		// Check if the generated Device ID already exists
		while (await accounts.findByDeviceId(randomDeviceId)) {
			// If it exists, generate a new token and try again
			randomDeviceId = generateRandomToken();
		}
		// Create a new account object with default values and the generated Device ID
		const newAccount = AccountSchema
			.omit({ _id: true })
			.parse({
				created_at: Dates.now('Europe/Lisbon').unix_timestamp,
				devices: [{ device_id: randomDeviceId }],
				updated_at: Dates.now('Europe/Lisbon').unix_timestamp,
			});
		// Save the new account to the database
		await accounts.insertOne(newAccount);
		// And return the generated Device ID
		return reply.send({ data: { device_id: randomDeviceId }, error: null, statusCode: HttpStatus.CREATED });
	}

	/**
	 * Deletes an account by Account ID.
	 * @param request Fastify request
	 * @param reply Fastify reply
	 */
	static async delete(request: FastifyRequest, reply: FastifyReply<void>) {
		await accounts.deleteById(request.device_id);
		return reply.send({ data: null, error: null, statusCode: HttpStatus.OK });
	}

	/**
	 * Retrieves an account by Account ID.
	 * @param request Fastify request
	 * @param reply Fastify reply
	 */
	static async get(request: FastifyRequest, reply: FastifyReply<Account>) {
		const foundAccount = await accounts.findByDeviceId(request.device_id);
		if (!foundAccount) throw new HttpException(HttpStatus.NOT_FOUND, 'Account not found');
		return reply.send({ data: foundAccount, error: null, statusCode: HttpStatus.OK });
	}

	/**
	 * Updates an account by Account ID.
	 * @param request Fastify request
	 * @param reply Fastify reply
	 */
	static async update(request: FastifyRequest<{ Body: Account }>, reply: FastifyReply<Account>) {
		console.log('UPDATE REQUEST', request.device_id);
		// Find the account by Account ID. If not found, throw 404.
		const foundAccount = await accounts.findByDeviceId(request.device_id);
		if (!foundAccount) throw new HttpException(HttpStatus.NOT_FOUND, 'Account not found');
		// Validate the request body against the Account schema. If invalid, throw 400.
		const { error, success } = AccountSchema.safeParse(request.body);
		if (!success) {
			const issues = error.issues.map(i => `${i.path.join('.')} - ${i.message}`).join('; ');
			throw new HttpException(HttpStatus.BAD_REQUEST, `Invalid Body: ${issues}`);
		}
		// Update the account in the database.
		const updateResult = await accounts.updateById(foundAccount._id, request.body);
		return reply.send({ data: updateResult, error: null, statusCode: HttpStatus.OK });
	}

	//
}
