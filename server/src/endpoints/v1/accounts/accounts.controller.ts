import HttpException from 'src/common/http-exception';
import HttpStatus from 'src/common/http-status';
import { bindMethods } from 'src/common/utils';
import { IAccount } from 'src/models/account';
import { IDevice } from 'src/models/device';
import { AccountModel, DeviceModel } from 'src/models/mongoose';
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

		if(request.fastifyUser.role === 'user' && request.fastifyUser.device_id !== id) {
			throw new HttpException(HttpStatus.FORBIDDEN, 'You are not allowed to delete this account')
		}

		return await this.service.deleteAccount(id);
	}

	async deleteDevice(request: FastifyRequest<{ Params: { deviceId: string, id: string } }>, reply: FastifyReply) {
		const id = request.params.id;
		const deviceId = request.params.deviceId;

		return await this.service.deleteDevice(id, deviceId);
	}

	async getAccountById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
		const { id } = request.params;

		if(request.fastifyUser.role === 'user' && request.fastifyUser.device_id !== id) {
			throw new HttpException(HttpStatus.UNAUTHORIZED, 'You are not authorized to execute this action')
		}

		return await this.service.getAccountById(id);
	}

	async getAccounts(request: FastifyRequest, reply: FastifyReply) {

		const permitedRoles = ['admin', 'owner'];
		if(!permitedRoles.includes(request.fastifyUser.role)) {
			throw new HttpException(HttpStatus.FORBIDDEN, 'You are not allowed to execute this action')
		}

		return await this.service.getAccounts();
	}

	async mergeDevice(request: FastifyRequest<{ Params: { deviceId: string, id: string } }>, reply: FastifyReply) {
		const id = request.params.id;
		const deviceId = request.params.deviceId;

		return await this.service.mergeDevice(id, deviceId);
	}

	async toggleFavoriteLine(request: FastifyRequest<{ Params: { id: string, line_id: string } }>, reply: FastifyReply) {
		const { id, line_id } = request.params;

		if(request.fastifyUser?.role === 'user' && request.fastifyUser?.device_id !== id) {
			throw new HttpException(HttpStatus.FORBIDDEN, 'You are not allowed to update this account')
		}

		return await this.service.toggleFavoriteLine(id, line_id);
	}

	async toggleFavoriteStop(request: FastifyRequest<{ Params: { id: string, stop_id: string } }>, reply: FastifyReply) {
		const { id, stop_id } = request.params;

		if(request.fastifyUser?.role === 'user' && request.fastifyUser?.device_id !== id) {
			throw new HttpException(HttpStatus.FORBIDDEN, 'You are not allowed to update this account')
		}

		return await this.service.toggleFavoriteStop(id, stop_id);
	}

	async updateAccount(request: FastifyRequest< { Params: { id: string }, Body: IAccount }>, reply: FastifyReply) {
		const { id } = request.params;
		
		// If the user is not an owner, it should not be possible to change the role
		console.log("fastifyUser", request.fastifyUser);
		if(request.fastifyUser?.role !== 'owner') {
			request.body.role = undefined;
		}

		// If the user is not admin/owner cant update the account
		// If account does not belong to the user, it should not be possible to update the account
		if(request.body.role === 'user' && request.fastifyUser.device_id !== id) {
			throw new HttpException(HttpStatus.FORBIDDEN, 'You are not allowed to update this account')

		}

		return await this.service.updateAccount(id, request.body as IAccount);
	}
}

export default AccountsController;
