import { AccountWidget, CreateAccountDto, SmartNotification } from '@/interfaces/account.type.js';
import { accounts } from '@/interfaces/accounts.interface.js';
import { calculateGeoFence } from '@/lib/utils';
import PatternService from '@/services/pattern.service';
import { sessions } from '@tmlmobilidade/interfaces';
import { HttpStatus } from '@tmlmobilidade/lib';
import { randomUUID } from 'crypto';
import { FastifyReply, FastifyRequest } from 'fastify';

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
			// Create the actual account
			const device_id = randomUUID();
			const account = await accounts.insertOne({
				devices: [
					{
						device_id,
						type: request.body.devices[0].type,
					},
				],
			});

			// Insert the token into the session collection
			const session_token = randomUUID();
			const session = await sessions.insertOne({
				token: session_token,
				user_id: account.insertedId,
			});

			// Check if the session was created successfully
			if (!session) {
				return reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
					message: 'Failed to create session',
				});
			}

			return reply.status(HttpStatus.CREATED).send({
				device_id,
				session_token,
			});
		}
		catch (error) {
			return reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send(error);
		}
	}

	/**
	 * Creates a new smart notification for an account
	 * @param request Fastify request containing account ID in params and smart notification data in body
	 * @param reply Fastify reply
	 */
	static async createSmartNotification(
		request: FastifyRequest<{ Body: AccountWidget, Params: { id: string } }>,
		reply: FastifyReply,
	) {
		const { id } = request.params;
		const notification = request.body;

		if (notification.data.type !== 'smart_notifications') {
			return reply.status(HttpStatus.BAD_REQUEST).send({
				message: 'Invalid notification type',
			});
		}

		const pattern = await PatternService.getInstance().getPattern(notification.data.pattern_id);
		const geoFence = await calculateGeoFence(pattern[0], notification.data.stop_id, notification.data.distance);

		const notificationData: SmartNotification = {
			...notification.data,
			geojson: geoFence,
		};

		const account = await accounts.addWidget(id, { ...notification, data: notificationData });

		return reply.status(HttpStatus.CREATED).send(account);
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
	 * Retrieves a record from composite_map.json
	  * @param request Fastify request
	 * @param reply Fastify reply
	 */
	static async getPersona(request: FastifyRequest, reply: FastifyReply) {
		try {
			const persona = await accounts.findPersona();
			return reply.status(HttpStatus.OK).send(persona);
		}
		catch (error) {
			return reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send(error);
		}
	}

	/**
	 * Retrieves a record from composite_map.json
	 * @param request Fastify request
	 * @param reply Fastify reply
	 */
	static async getPersonaImageById(
		request: FastifyRequest<{ Params: { id: string } }>,
		reply: FastifyReply,
	) {
		try {
			const { id } = request.params;
			return reply.sendFile(`/personas/${id}`);
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
