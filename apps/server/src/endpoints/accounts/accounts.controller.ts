/* * */

import { migrateAccountToLatestVersion } from '@/services/migration.js';
import { getRandomPersonaImageId } from '@/services/personas.js';
import { accounts } from '@carrismetropolitana/accounts-interfaces';
import { type Account, AccountSchema } from '@carrismetropolitana/accounts-types';
import TIMETRACKER from '@helperkits/timer';
import { type FastifyReply, type FastifyRequest } from '@tmlmobilidade/connectors';
import { HttpException, HttpStatus } from '@tmlmobilidade/lib';
import { Logs } from '@tmlmobilidade/utils';
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
		// Setup logging
		const timer = new TIMETRACKER();
		Logs.info(`[${request.id}] [AccountsController] [create] Creating a new account...`);
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
				persona: { image_id: getRandomPersonaImageId() },
				updated_at: Dates.now('Europe/Lisbon').unix_timestamp,
			});
		// Save the new account to the database
		await accounts.insertOne(newAccount);
		// And return the generated Device ID
		Logs.info(`[${request.id}] [AccountsController] [create] Random Device ID ${randomDeviceId} created successfully in ${timer.get()}.`);
		return reply.send({ data: { device_id: randomDeviceId }, error: null, statusCode: HttpStatus.CREATED });
	}

	/**
	 * Deletes an account by Device ID.
	 * @param request Fastify request
	 * @param reply Fastify reply
	 */
	static async delete(request: FastifyRequest, reply: FastifyReply<void>) {
		await accounts.deleteById(request.device_id);
		return reply.send({ data: null, error: null, statusCode: HttpStatus.OK });
	}

	/**
	 * Retrieves an account by Device ID.
	 * @param request Fastify request
	 * @param reply Fastify reply
	 */
	static async get(request: FastifyRequest, reply: FastifyReply<Account>) {
		// Setup logging
		const timer = new TIMETRACKER();
		Logs.info(`[${request.id}] [AccountsController] [get] Retrieving account...`);
		// Find the account by Device ID. If not found, throw 404.
		let foundAccount = await accounts.findByDeviceId(request.device_id);
		if (!foundAccount) throw new HttpException(HttpStatus.NOT_FOUND, 'ACCOUNT_NOT_FOUND');
		// Verify the schema version of the account document.
		// If necessary, migrate the document to the latest schema version.
		if (foundAccount._version !== '1.0') {
			foundAccount = migrateAccountToLatestVersion(foundAccount, request.device_id);
			// Update the migrated document in the database.
			await accounts.deleteById(foundAccount._id);
			await accounts.updateById(foundAccount._id, foundAccount, { upsert: true });
		}
		Logs.info(`[${request.id}] [AccountsController] [get] Account ${foundAccount._id} retrieved successfully in ${timer.get()}.`);
		return reply.send({ data: foundAccount, error: null, statusCode: HttpStatus.OK });
	}

	/**
	 * Updates an account by Device ID.
	 * @param request Fastify request
	 * @param reply Fastify reply
	 */
	static async update(request: FastifyRequest<{ Body: Account }>, reply: FastifyReply<Account>) {
		// Setup logging
		const timer = new TIMETRACKER();
		Logs.info(`[${request.id}] [AccountsController] [update] Updating account...`);
		// Find the account by Device ID. If not found, throw 404.
		let foundAccount = await accounts.findByDeviceId(request.device_id);
		if (!foundAccount) throw new HttpException(HttpStatus.NOT_FOUND, 'Account not found');
		// Verify the schema version of the account document.
		// If necessary, migrate the document to the latest schema version.
		if (foundAccount._version !== '1.0') {
			foundAccount = migrateAccountToLatestVersion(foundAccount, request.device_id);
			// Update the migrated document in the database.
			await accounts.deleteById(foundAccount._id);
			await accounts.updateById(foundAccount._id, foundAccount, { upsert: true });
		}
		// Validate the request body against the Account schema. If invalid, throw 400.
		const { error, success } = AccountSchema.safeParse(request.body);
		if (!success) {
			const issues = error.issues.map(i => `${i.path.join('.')} - ${i.message}`).join('; ');
			throw new HttpException(HttpStatus.BAD_REQUEST, `Invalid Body: ${issues}`);
		}
		// Update the account in the database.
		const updateResult = await accounts.updateById(foundAccount._id, request.body);
		Logs.info(`[${request.id}] [AccountsController] [update] Account ${foundAccount._id} updated successfully in ${timer.get()}.`);
		return reply.send({ data: updateResult, error: null, statusCode: HttpStatus.OK });
	}

	//
}
