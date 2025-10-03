/* * */

import { type Account, AccountCreateDto, AccountSchema, type AccountUpdateDto, CreateAccountSchema, UpdateAccountSchema } from '@carrismetropolitana/accounts-pckg-types';
import { type IndexDescription, MongoCollectionClass } from '@tmlmobilidade/interfaces';
import { AsyncSingletonProxy } from '@tmlmobilidade/utils';

/* * */

class AccountsClass extends MongoCollectionClass<Account, AccountCreateDto, AccountUpdateDto> {
	//

	private static _instance: AccountsClass;

	protected override createSchema = AccountSchema;
	protected override updateSchema = UpdateAccountSchema;

	private constructor() {
		super();
	}

	public static async getInstance() {
		if (!AccountsClass._instance) {
			const instance = new AccountsClass();
			await instance.connect();
			AccountsClass._instance = instance;
		}
		return AccountsClass._instance;
	}

	/**
	 * Finds an account document by its device ID.
	 * @param deviceId The device ID of the document to find.
	 * @returns A promise that resolves to the matching document or null if not found.
	 */
	async findByDeviceId(deviceId: string): Promise<Account | null> {
		const foundAccount = await this.mongoCollection.findOne({ 'devices.device_id': { $eq: deviceId } });
		if (!foundAccount) return null;
		return foundAccount;
	}

	protected getCollectionIndexes(): IndexDescription[] {
		return [
			{ background: true, key: { 'profile.email': 1 }, unique: true },
			{ background: true, key: { 'devices.device_id': 1 }, unique: true },
		];
	}

	protected getCollectionName(): string {
		return 'accounts';
	}

	protected getEnvName(): string {
		return 'DATABASE_URI';
	}

	//
}

/* * */

export const accounts = AsyncSingletonProxy(AccountsClass);
