import { MongoCollectionClass } from '@tmlmobilidade/interfaces';
import { AsyncSingletonProxy } from '@tmlmobilidade/utils';
import { Filter, IndexDescription, WithId } from 'mongodb';
import { Account, AccountSchema, UpdateAccountDto, UpdateAccountSchema } from './account.type.js';
import { CreateAccountDto } from './account.type.js';
import { z } from 'zod';

class AccountsClass extends MongoCollectionClass<Account, CreateAccountDto, UpdateAccountDto> {
	private static _instance: AccountsClass;

	protected override createSchema: z.ZodSchema = AccountSchema;
	protected override updateSchema: z.ZodSchema = UpdateAccountSchema;

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
	 * Finds a user document by its email.
	 *
	 * @param email - The email of the user to find
	 * @returns A promise that resolves to the matching user document or null if not found
	 */
	async findByEmail(email: string): Promise<null | WithId<Account>> {
		const user = await this.mongoCollection.findOne({ email } as Filter<Account>);
		if (!user) {
			return null;
		}

		return user as WithId<Account>;
	}

	/**
	 * Finds a document by its ID.
	 *
	 * @param id - The ID of the document to find
	 * @returns A promise that resolves to the matching document or null if not found
	 */
	override async findById(id: string) {
		const user = await this.mongoCollection.findOne({ _id: id } as unknown as Filter<Account>);
		if (!user) {
			return null;
		}

		return user as WithId<Account>;
	}

    /**
     * Finds a document by its device ID.
     *
     * @param deviceId - The device ID of the document to find
     * @returns A promise that resolves to the matching document or null if not found
     */
	async findByDeviceId(deviceId: string) {
		const user = await this.mongoCollection.findOne({ devices: { $elemMatch: { device_id: deviceId } } } as unknown as Filter<Account>);
		if (!user) {
			return null;
		}
		return user as WithId<Account>;
	}

	protected getCollectionIndexes(): IndexDescription[] {
		return [
			{ background: true, key: { email: 1 }, unique: true },
			{ background: true, key: { 'devices.device_id': 1 }, unique: true },
		];
	}

	protected getCollectionName(): string {
		return 'accounts';
	}

	protected getEnvName(): string {
        return 'ACCOUNTS_DB_URI';
	}
}

export const accounts = AsyncSingletonProxy(AccountsClass);
