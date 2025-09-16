/* * */

import { accounts } from '@/interfaces/accounts.interface.js';
import { type Account, AccountSchema } from '@/schemas/account';
import { type FastifyReply, type FastifyRequest } from '@tmlmobilidade/connectors';
import { HttpException, HttpStatus } from '@tmlmobilidade/lib';
import { generateRandomToken } from '@tmlmobilidade/utils';
import fs from 'node:fs';

/* * */

export class AccountsController {
	//

	/**
	 * Create a new empty account with a random Account ID.
	 * @param request Fastify request
	 * @param reply Fastify reply
	 */
	static async create(request: FastifyRequest, reply: FastifyReply<Account>) {
		// Generate a random Account ID
		let randomAccountId = generateRandomToken();
		// Check if the generated Account ID already exists
		while (await accounts.findById(randomAccountId)) {
			// If it exists, generate a new token and try again
			randomAccountId = generateRandomToken();
		}
		// Create a new account object with default values and the generated Account ID
		const newAccount = AccountSchema.strip().parse({ _id: randomAccountId });
		// Save the new account to the database
		const createdAccount = await accounts.insertOne(newAccount);
		return reply.send({ data: createdAccount, error: null, statusCode: HttpStatus.CREATED });
	}

	/**
	 * Deletes an account by Account ID.
	 * @param request Fastify request
	 * @param reply Fastify reply
	 */
	static async delete(request: FastifyRequest, reply: FastifyReply<void>) {
		await accounts.deleteById(request.account_id);
		return reply.send({ data: null, error: null, statusCode: HttpStatus.OK });
	}

	/**
	 * Retrieves an account by Account ID.
	 * @param request Fastify request
	 * @param reply Fastify reply
	 */
	static async get(request: FastifyRequest, reply: FastifyReply<Account>) {
		const foundAccount = await accounts.findById(request.account_id);
		if (!foundAccount) throw new HttpException(HttpStatus.NOT_FOUND, 'Account not found');
		return reply.send({ data: foundAccount, error: null, statusCode: HttpStatus.OK });
	}

	/**
	 * Retrieves a persona
	 * @param request Fastify request
	 * @param reply Fastify reply
	 */
	static async getPersona(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply<{ id: string, url: string }>) {
		const imagesDir = '/app/dist/public/personas';
		const availableImages = fs.readdirSync(imagesDir);
		const randomIndex = Math.floor(Math.random() * availableImages.length);
		const randomSelection = availableImages[randomIndex];
		return reply.send({ data: { id: randomSelection, url: randomSelection }, error: null, statusCode: HttpStatus.OK });
	}

	/**
	 * Retrieves a record from composite_map.json
	 * @param request Fastify request
	 * @param reply Fastify reply
	 */
	static async getPersonaImageById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply<void>) {
		return reply.sendFile(`/personas/${request.params.id}`);
	}

	/**
	 * Updates an account by Account ID.
	 * @param request Fastify request
	 * @param reply Fastify reply
	 */
	static async update(request: FastifyRequest<{ Body: Account }>, reply: FastifyReply<Account>) {
		// Find the account by Account ID. If not found, throw 404.
		const foundAccount = await accounts.findById(request.account_id);
		if (!foundAccount) throw new HttpException(HttpStatus.NOT_FOUND, 'Account not found');
		// Validate the request body against the Account schema. If invalid, throw 400.
		const { error, success } = AccountSchema.safeParse(request.body);
		if (!success) {
			const issues = error.issues.map(i => `${i.path.join('.')} - ${i.message}`).join('; ');
			throw new HttpException(HttpStatus.BAD_REQUEST, `Invalid Body: ${issues}`);
		}
		// Update the account in the database.
		const updateResult = await accounts.updateById(request.account_id, request.body);
		return reply.send({ data: updateResult, error: null, statusCode: HttpStatus.OK });
	}

	//
}

/* * */

// async function processSmartNotifications(account: Account, smartNotificationsToProcess: SmartNotification[]): Promise<Account> {
// 	for (const smartNotification of smartNotificationsToProcess ?? []) {
// 		// Get Stop
// 		const stop = await StopsService.getInstance().getStop(smartNotification.stop_id);

// 		const pattern = await PatternService.getInstance().getPattern(smartNotification.pattern_id);
// 		const geoFence = await calculateGeoFence(pattern[0], stop, smartNotification.distance);

// 		if (!geoFence) {
// 			throw new HttpException(HttpStatus.INTERNAL_SERVER_ERROR, 'Invalid geo fence');
// 		}

// 		const widgetIndex = account.widgets.findIndex(
// 			w => w.data.type === 'smart_notifications' && (w.data as SmartNotification).id === smartNotification.id,
// 		);

// 		const notificationData: SmartNotification = { ...smartNotification, geojson: geoFence, stop_name: stop.long_name };

// 		if (widgetIndex !== -1) {
// 			account.widgets[widgetIndex].data = notificationData;
// 		}
// 		else {
// 			account.widgets.push({ data: notificationData, settings: { display_order: 0, is_open: true, label: null } });
// 		}
// 	}

// 	return account;
// }
