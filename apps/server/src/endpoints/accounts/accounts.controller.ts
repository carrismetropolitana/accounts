/* * */

import { migrateAccountToLatestVersion } from '@/services/migration.js';
import { getRandomPersonaImageId } from '@/services/personas.js';
import { accounts } from '@carrismetropolitana/accounts-pckg-interfaces';
import { type Account, AccountSchema } from '@carrismetropolitana/accounts-pckg-types';
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
		Logs.success(`[${request.id}] [AccountsController] [create] Random Device ID ${randomDeviceId} created successfully in ${timer.get()}.`, 1);
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
		// Skip if device ID is invalid (temporary check)
		if (request.device_id === 'newDeviceId') throw new HttpException(HttpStatus.BAD_REQUEST, 'INVALID_DEVICE_ID');
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
		Logs.success(`[${request.id}] [AccountsController] [get] Account ${foundAccount._id} retrieved successfully in ${timer.get()}.`, 1);
		return reply.send({ data: foundAccount, error: null, statusCode: HttpStatus.OK });
	}

	/**
	 * Updates an account by Device ID.
	 * @param request Fastify request
	 * @param reply Fastify reply
	 */
	static async update(request: FastifyRequest<{ Body: Account }>, reply: FastifyReply<Account>) {
		//

		//
		// Skip if device ID is invalid (temporary check)

		if (request.device_id === 'newDeviceId') throw new HttpException(HttpStatus.BAD_REQUEST, 'INVALID_DEVICE_ID');

		//
		// Setup logging

		const timer = new TIMETRACKER();
		Logs.info(`[${request.id}] [AccountsController] [update] Updating account...`);

		//
		// Find the account by Device ID. If not found, throw 404.

		let foundAccount = await accounts.findByDeviceId(request.device_id);
		if (!foundAccount) throw new HttpException(HttpStatus.NOT_FOUND, 'Account not found');

		//
		// Verify the schema version of the account document.
		// If necessary, migrate the document to the latest schema version.

		if (foundAccount._version !== '1.0') {
			foundAccount = migrateAccountToLatestVersion(foundAccount, request.device_id);
			// Update the migrated document in the database.
			await accounts.deleteById(foundAccount._id);
			await accounts.updateById(foundAccount._id, foundAccount, { upsert: true });
		}

		//
		// Ensure there is only one Expo notification token per account in the database.
		// Keep only the device with the most recent updated_at timestamp.

		for (const deviceData of foundAccount.devices) {
			// Skip if there is no push token
			if (!deviceData.push_token) continue;
			// Find other accounts with the same push token
			const otherAccountsWithTheSamePushToken = await accounts.findMany({ 'devices.push_token': deviceData.push_token });
			// If more than one account has the same push token,
			// delete the device object from that account as it is a duplicate.
			// Keep only the one with the most recent updated_at timestamp.
			for (const otherAccount of otherAccountsWithTheSamePushToken) {
				// Skip if it's the same account
				if (otherAccount._id === foundAccount._id) continue;
				// If another account has the same push token,
				// remove the device object from the account.
				otherAccount.devices = otherAccount.devices
					.map(item => item.push_token === deviceData.push_token ? null : item)
					.filter(item => !!item);
				// If the account has no devices left, delete it.
				if (otherAccount.devices.length === 0) {
					await accounts.deleteById(otherAccount._id);
					Logs.info(`[${request.id}] [AccountsController] [update] Deleted account ${otherAccount._id} as it had no devices left after removing duplicate push token.`);
					continue;
				}
				// Update the account in the database.
				await accounts.updateById(otherAccount._id, otherAccount);
				Logs.info(`[${request.id}] [AccountsController] [update] Removed duplicate push token from account ${otherAccount._id}.`);
			}
		}

		//
		// Validate the request body against the Account schema. If invalid, throw 400.

		const { error, success } = AccountSchema.safeParse(request.body);

		if (!success) {
			const issues = error.issues.map(i => `${i.path.join('.')} - ${i.message}`).join('; ');
			throw new HttpException(HttpStatus.BAD_REQUEST, `Invalid Body: ${issues}`);
		}

		//
		// Update the account in the database.

		const updateResult = await accounts.updateById(foundAccount._id, request.body);

		//
		// Return the updated account.

		Logs.success(`[${request.id}] [AccountsController] [update] Account ${foundAccount._id} updated successfully in ${timer.get()}.`, 1);

		return reply.send({ data: updateResult, error: null, statusCode: HttpStatus.OK });
	}

	//
}
