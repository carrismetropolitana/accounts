import { Account, AccountSchema, SmartNotification } from '@/interfaces/account.type';
import { accounts } from '@/interfaces/accounts.interface.js';
import { calculateGeoFence } from '@/lib/utils';
import PatternService from '@/services/pattern.service';
import StopsService from '@/services/stops.service';
import { FastifyReply, FastifyRequest } from '@tmlmobilidade/connectors';
import { HttpException, HttpStatus } from '@tmlmobilidade/lib';

/**
 * This is an example controller that is using the accounts interface.
 */
export class AccountsController {
	/**
	 * Deletes an account by ID
	 * @param request Fastify request containing account ID in params
	 * @param reply Fastify reply
	 */
	static async delete(
		request: FastifyRequest,
		reply: FastifyReply<void>,
	) {
		await accounts.deleteOne({ 'devices.device_id': request.account_id });
		return reply.send({ data: null, error: null, statusCode: HttpStatus.OK });
	}

	/**
	 * Retrieves an account by device ID
	 * @param request Fastify request containing device ID in params
	 * @param reply Fastify reply
	 */
	static async getByUserId(request: FastifyRequest, reply: FastifyReply<Account>) {
		const account = await accounts.findByDeviceId(request.account_id);

		if (!account) throw new HttpException(HttpStatus.NOT_FOUND, 'Account not found');

		return reply.send({ data: account, error: null, statusCode: HttpStatus.OK });
	}

	/**
	 * Retrieves a record from composite_map.json
	  * @param request Fastify request
	 * @param reply Fastify reply
	 */
	static async getPersona(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply<{ id: string, url: string }>) {
		const persona = await accounts.findPersona();
		return reply.send({ data: { id: persona.id, url: persona.url }, error: null, statusCode: HttpStatus.OK });
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
	 * Syncs an account
	 * @param request Fastify request
	 * @param reply Fastify reply
	 */
	static async sync(request: FastifyRequest<{ Body: Account }>, reply: FastifyReply<Account>) {
		let account: Account;
		const deviceId = request.headers.authorization?.split(' ')[1];
		const { error, success } = AccountSchema.safeParse(request.body);

		if (!success) {
			const issues = error.issues.map(i => `${i.path.join('.')} - ${i.message}`).join('; ');
			throw new HttpException(HttpStatus.BAD_REQUEST, `Invalid Body: ${issues}`);
		}

		const currentAccount = await accounts.findByDeviceId(deviceId);

		const smartNotificationsToProcess: SmartNotification[] = [];
		for (const widget of request.body.widgets ?? []) {
			if (widget.data.type != 'smart_notifications') continue;

			const smartNotification = widget.data as SmartNotification;

			// A. Check if the smart notification does not exist in the current account
			const currentSmartNotification = currentAccount?.widgets?.find(w => w.data.type === 'smart_notifications' && (w.data as SmartNotification).id === smartNotification.id);
			if (!currentSmartNotification) {
				smartNotificationsToProcess.push(smartNotification);
				continue;
			}

			// B. Check if the smart notification is different from the current one
			if (JSON.stringify(currentSmartNotification.data) !== JSON.stringify(smartNotification)) {
				smartNotificationsToProcess.push(smartNotification);
				continue;
			}
		}

		if (smartNotificationsToProcess.length === 0) {
			account = await accounts.updateOne({ 'devices.device_id': { $in: [deviceId] } }, request.body);
		}
		else {
			const processedAccount = await processSmartNotifications(request.body, smartNotificationsToProcess);
			account = await accounts.updateOne({ 'devices.device_id': { $in: [deviceId] } }, processedAccount);
		}

		return reply.send({
			data: account,
			error: null,
			statusCode: HttpStatus.OK,
		});
	}
}

async function processSmartNotifications(account: Account, smartNotificationsToProcess: SmartNotification[]): Promise<Account> {
	for (const smartNotification of smartNotificationsToProcess ?? []) {
		// Get Stop
		const stop = await StopsService.getInstance().getStop(smartNotification.stop_id);

		const pattern = await PatternService.getInstance().getPattern(smartNotification.pattern_id);
		const geoFence = await calculateGeoFence(pattern[0], stop, smartNotification.distance);

		if (!geoFence) {
			throw new HttpException(HttpStatus.INTERNAL_SERVER_ERROR, 'Invalid geo fence');
		}

		const widgetIndex = account.widgets.findIndex(
			w => w.data.type === 'smart_notifications' && (w.data as SmartNotification).id === smartNotification.id,
		);

		const notificationData: SmartNotification = { ...smartNotification, geojson: geoFence, stop_name: stop.long_name };

		if (widgetIndex !== -1) {
			account.widgets[widgetIndex].data = notificationData;
		}
		else {
			account.widgets.push({ data: notificationData, settings: { display_order: 0, is_open: true, label: null } });
		}
	}

	return account;
}
