import HttpException from 'server/src/common/http-exception';
import HttpStatus from 'server/src/common/http-status';
import { decodeJWT, verifyJWT } from 'server/src/common/utils';
import { IAccount } from 'server/src/models/account';
import { IDevice } from 'server/src/models/device';
import { ILine } from 'server/src/models/line';
import { AccountModel } from 'server/src/models/mongoose';
import { IStop } from 'server/src/models/stop';
import MongooseService from 'server/src/services/mongoose.service';
import { mergician } from 'mergician';
import { FilterQuery, Model, QueryOptions, UpdateQuery } from 'mongoose';

class AccountsService {
	private readonly accountModel: Model<IAccount>;
	private readonly moogoseService: MongooseService;

	constructor() {
		this.moogoseService = MongooseService.getInstance();
		this.accountModel = AccountModel;
	}

	private async _newAccountFromDeviceId(id: string): Promise<IAccount | null> {
		const newAccount: Partial<IAccount> = {
			devices: [
				{ device_id: id } as IDevice,
			],
		};

		return await this.createAccount(
			newAccount as IAccount,
		);
	}

	/** Adds a device to an account
	 *
	 * @param id The ID of the account to add the device to.
	 * @param devioce The device to add.
	 * @returns The updated account.
	*/
	async addDevice(token: string): Promise<IAccount | null> {
		// Verify the token
		if (!verifyJWT(token)) {
			throw new HttpException(HttpStatus.UNAUTHORIZED, 'Invalid authorization token');
		}

		// Decode the token
		const decodedToken = await decodeJWT(token);

		return await this.mergeDevice(decodedToken.data.device_id, decodedToken.data.device_id_2);
	}

	/** Creates a new account.
	 *
	 * @param account The account to create.
	 * @returns The created account.
	*/
	async createAccount(account: IAccount): Promise<IAccount> {
		const searchQuery: FilterQuery<IAccount> = { $or: [
			...account.devices.map(device => ({ devices: { $elemMatch: { device_id: device.device_id } } })),
		] };

		return await this.moogoseService.createUnique(this.accountModel, account, searchQuery);
	}

	/** Deletes an account.
	 *
	 * @param id The ID of the account to delete.
	 * @returns The deleted account.
	*/
	async deleteAccount(id: string): Promise<IAccount | null> {
		const searchQuery: FilterQuery<IAccount> = { devices: { $elemMatch: { device_id: id } } };
		return await this.moogoseService.deleteOne(this.accountModel, searchQuery);
	}

	/** Deletes a device from an account.
	 *
	 * @param id The ID of the account to delete the device from.
	 * @param deviceId The ID of the device to delete.
	 * @returns The updated account.
	*/
	async deleteDevice(id: string, deviceId: string): Promise<IAccount | null> {
		const searchQuery: FilterQuery<IAccount> = { devices: { $elemMatch: { device_id: id } } };
		const updateQuery: UpdateQuery<IAccount> = { $pull: { devices: { device_id: deviceId } } };
		const updateOptions: QueryOptions<IAccount> = {
			new: true,
		};

		const update = await this.moogoseService.updateOne(this.accountModel, searchQuery, updateQuery, updateOptions);

		// If the account doesn't exist, return null
		if (!update) {
			return null;
		}

		// If the account has no devices left, delete it
		if (update.devices.length === 0) {
			return await this.deleteAccount(id);
		}

		return update;
	}

	/** Gets an account by ID.
	 *
	 * @param id The ID of the account to get.
	 * @returns The account with the given ID.
	*/
	async getAccountById(id: string): Promise<IAccount | null> {
		const searchQuery: FilterQuery<IAccount> = { devices: { $elemMatch: { device_id: id } } };
		return await this.moogoseService.findOne(this.accountModel, searchQuery);
	}

	/** Gets all accounts.
	 *
	 * @returns All accounts.
	*/
	async getAccounts(): Promise<IAccount[]> {
		return await this.moogoseService.find(this.accountModel);
	}

	/** Merges a device to an account
	 *
	 * @param account1Id The ID of one of the devices to merge.
	 * @param account2Id The ID of the other device to merge.
	 * @returns The updated account.
	 */
	async mergeDevice(device1Id: string, device2Id: string): Promise<IAccount | null> {
		const searchDevice1Query: FilterQuery<IAccount> = { devices: { $elemMatch: { device_id: device1Id } } };
		const searchDevice2Query: FilterQuery<IAccount> = { devices: { $elemMatch: { device_id: device2Id } } };

		const account1 = await this.moogoseService.findOne(this.accountModel, searchDevice1Query);
		const account2 = await this.moogoseService.findOne(this.accountModel, searchDevice2Query);

		// If no accounts were found, return null
		if (account1 && account2) {
			throw new HttpException(HttpStatus.NOT_FOUND, 'Accounts not found');
		}

		// If either account is not found, Create a new account for the device that wasn't found
		if (!account1 || !account2) {
			return await this._newAccountFromDeviceId(!account1 ? device1Id : device2Id);
		}

		// If the account ids are the same
		// Then account is already merged
		if (account1.id === account2.id) {
			throw new HttpException(HttpStatus.BAD_REQUEST, 'Cannot merge the same account');
		}

		const mergedAccountData = mergician({
			appendArrays: true,
			dedupArrays: true,
			skipKeys: ['_id', '__v'],
		})({}, account1.toObject(), account2.toObject());

		/**
		 * Transaction to merge the and delete the second account
		 */
		return this.moogoseService.getConnection.startSession().then((session) => {
			return session.withTransaction(async () => {
				// Delete the accounts
				await this.deleteAccount(device1Id);
				await this.deleteAccount(device2Id);

				// Create the merged account
				const mergedAccount = this.createAccount(mergedAccountData);

				await session.commitTransaction();
				return mergedAccount;
			});
		});
	}

	/** Adds/Removes a favorite line to an account.
	 *
	 * @param id The ID of the account to add/remove the favorite line to.
	 * @param line_id The ID of the favorite line to add/remove.
	 * @returns The updated account.
	*/
	async toggleFavoriteLine(id: string, line_id: string): Promise<IAccount | null> {
		const searchQuery: FilterQuery<IAccount> = { devices: { $elemMatch: { device_id: id } } };
		const addQuery: UpdateQuery<IAccount> = { $push: { favorite_lines: line_id } };
		const removeQuery: UpdateQuery<IAccount> = { $pull: { favorite_lines: line_id } };

		// Check if the account exists
		// If not, create a new account
		let account = await this.getAccountById(id);
		if (!account) {
			console.log('Creating account');
			account = await this._newAccountFromDeviceId(id);
		}

		// Check if the account already has the line, remove it
		if (account.favorite_lines?.find(fav => fav === line_id)) {
			return await this.moogoseService.updateOne(this.accountModel, searchQuery, removeQuery);
		}

		return await this.moogoseService.updateOne(this.accountModel, searchQuery, addQuery);
	}

	/** Adds/Removes a favorite stop to an account.
	 *
	 * @param id The ID of the account to add/remove the favorite stop to.
	 * @param stop_id The ID of the favorite stop to add/remove.
	 * @returns The updated account.
	*/
	async toggleFavoriteStop(id: string, stop_id: string): Promise<IAccount | null> {
		const searchQuery: FilterQuery<IAccount> = { devices: { $elemMatch: { device_id: id } } };
		const addQuery: UpdateQuery<IAccount> = { $push: { favorite_stops: stop_id } };
		const removeQuery: UpdateQuery<IAccount> = { $pull: { favorite_stops: stop_id } };

		// Check if the account exists
		// If not, create a new account
		let account = await this.getAccountById(id);
		if (!account) {
			console.log('Creating account');
			account = await this._newAccountFromDeviceId(id);
		}

		// Check if the account already has the line
		if (account.favorite_stops?.find(fav => fav === stop_id)) {
			return await this.moogoseService.updateOne(this.accountModel, searchQuery, removeQuery);
		}

		return await this.moogoseService.updateOne(this.accountModel, searchQuery, addQuery);
	}

	/** Updates an account.
	 *
	 * @param id The ID of the account to update.
	 * @param account The account to update.
	 * @returns The updated account.
	*/
	async updateAccount(id: string, account: IAccount): Promise<IAccount | null> {
		const searchQuery: FilterQuery<IAccount> = { devices: { $elemMatch: { device_id: id } } };
		const updateQuery: UpdateQuery<IAccount> = { $set: account };
		const updateOptions: QueryOptions<IAccount> = {
			new: true,
		};

		return await this.moogoseService.updateOne(this.accountModel, searchQuery, updateQuery, updateOptions);
	}
}

export default AccountsService;
