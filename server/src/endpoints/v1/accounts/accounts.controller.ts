import HttpException from '@/common/http-exception';
import HttpStatus from '@/common/http-status';
import { bindMethods } from '@/common/utils';
import { IAccount } from '@/models/account';
import { IDevice } from '@/models/device';
import { AccountModel, DeviceModel } from '@/models/mongoose';
import { FastifyReply, FastifyRequest } from 'fastify';

import AccountsService from './accounts.service';

class AccountsController {
	private readonly service: AccountsService;

	constructor() {
		this.service = new AccountsService();

		// Bind methods
		bindMethods(AccountsController.prototype, this);
	}

	async addDevice(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
		const token = request.headers['authorization'].split(' ')[1];

		if (!token || token.length === 0) {
			throw new HttpException(HttpStatus.UNAUTHORIZED, 'Missing authorization token');
		}

		return await this.service.addDevice(token);
	}

	async createAccount(request: FastifyRequest, reply: FastifyReply) {
		const account = new AccountModel(request.body as IAccount);

		const error = account.validateSync();
		if (error) {
			throw new HttpException(HttpStatus.BAD_REQUEST, error.message);
		}

		return await this.service.createAccount(account);
	}

	// TODO: Needs to be protected
	async deleteAccount(request: FastifyRequest, reply: FastifyReply) {
		const { id } = request.params as { id: string };

		const account = await this.service.deleteAccount(id);

		if (!account) {
			throw new HttpException(HttpStatus.NOT_FOUND, 'Account not found');
		}

		return reply.send(account);
	}

	async deleteDevice(request: FastifyRequest<{ Params: { deviceId: string, id: string } }>, reply: FastifyReply) {
		const id = request.params.id;
		const deviceId = request.params.deviceId;

		return await this.service.deleteDevice(id, deviceId);
	}

	async getAccountById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
		const { id } = request.params;

		const account = await this.service.getAccountById(id);

		if (!account) {
			throw new HttpException(HttpStatus.NOT_FOUND, 'Account not found');
		}

		reply.send(account);
	}

	async getAccounts(request: FastifyRequest, reply: FastifyReply) {
		const accounts = await this.service.getAccounts();
		reply.send(accounts);
	}

	async mergeDevice(request: FastifyRequest<{ Params: { deviceId: string, id: string } }>, reply: FastifyReply) {
		const id = request.params.id;
		const deviceId = request.params.deviceId;

		return await this.service.mergeDevice(id, deviceId);
	}

	// Todo: Needs to be protected
	async toggleFavoriteLine(request: FastifyRequest<{ Params: { id: string, line_id: string } }>, reply: FastifyReply) {
		const { id, line_id } = request.params;

		return await this.service.toggleFavoriteLine(id, line_id);
	}

	// Todo: Needs to be protected
	async toggleFavoriteStop(request: FastifyRequest<{ Params: { id: string, stop_id: string } }>, reply: FastifyReply) {
		const { id, stop_id } = request.params;

		return await this.service.toggleFavoriteStop(id, stop_id);
	}

	async updateAccount(request: FastifyRequest, reply: FastifyReply) {
		throw new HttpException(HttpStatus.NOT_IMPLEMENTED, 'Not implemented');
	}
}

export default AccountsController;
