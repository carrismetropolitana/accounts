/* * */

import { type Account, AccountSchema } from '@carrismetropolitana/accounts-types';
import { type IndexDescription, MongoCollectionClass } from '@tmlmobilidade/interfaces';
import { AsyncSingletonProxy } from '@tmlmobilidade/utils';

/* * */

class AccountsClass extends MongoCollectionClass<Account, Account, Account> {
	//

	private static _instance: AccountsClass;

	protected override createSchema = AccountSchema;
	protected override updateSchema = AccountSchema;

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
	 * Add a widget to an account.
	 * @param account_id The ID of the account to add the widget to
	 * @param widget The widget to add
	 * @returns A promise that resolves to the updated account
	 */
	// async addWidget(account_id: string, widget: Widget) {
	// 	const account = await this.findById(account_id);
	// 	if (!account) throw new HttpException(404, 'Account not found');

	// 	if (widget.data.type === 'smart_notifications') {
	// 		if (!widget.data.id) {
	// 			throw new HttpException(400, 'Smart notification widget must have an id');
	// 		}

	// 		if (!account.widgets) {
	// 			account.widgets = [];
	// 		}

	// 		const hasSmartNotificationWidget = account.widgets.find(w => w.data.type === 'smart_notifications' && (w.data as SmartNotification).id === (widget.data as SmartNotification).id);
	// 		if (hasSmartNotificationWidget) {
	// 			account.widgets = account.widgets.map((w) => {
	// 				if (w.data.type === 'smart_notifications' && (w.data as SmartNotification).id === (widget.data as SmartNotification).id) {
	// 					return widget;
	// 				}
	// 				return w;
	// 			});
	// 			await this.updateById(account._id, convertObject(account, this.updateSchema as any));
	// 			return account;
	// 		}
	// 	}

	// 	account.widgets.push(widget);
	// 	await this.updateById(account._id, convertObject(account, this.updateSchema as any));

	// 	return account;
	// }

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

	/**
	 * Finds an account document by its email.
	 * @param email The email of the account to find
	 * @returns A promise that resolves to the matching account document or null if not found
	 */
	async findByEmail(email: string): Promise<Account | null> {
		const foundAccount = await this.mongoCollection.findOne({ 'profile.email': { $eq: email } });
		if (!foundAccount) return null;
		return foundAccount;
	}

	// /**
	//  * Updates a single account document matching the filter criteria.
	//  * @param filter The filter criteria to match the account to update
	//  * @param updateFields The fields to update in the account
	//  * @param options The options for the update operation
	//  * @returns A promise that resolves to the updated account document
	//  * @throws {HttpException} If validation fails, update is not acknowledged, or updated document is not found
	//  */
	// override async updateById<TReturnDocument extends boolean = true>(filter: Filter<Account>, updateFields: Partial<Account>, options?: UpdateOptions & { returnResult?: TReturnDocument }): Promise<TReturnDocument extends true ? WithId<Account> : UpdateResult<Account>> {
	// 	const parsedUpdateFields = this.updateSchema.safeParse(updateFields);

	// 	if (!parsedUpdateFields.success) {
	// 		throw new HttpException(HttpStatus.BAD_REQUEST, 'Invalid update fields: ' + parsedUpdateFields.error.issues.map(issue => issue.message).join(', '), parsedUpdateFields.error);
	// 	}

	// 	const result = await this.mongoCollection.updateOne(
	// 		filter,
	// 		{ $set: parsedUpdateFields.data } as unknown as Partial<Account>,
	// 		{ ...options },
	// 	);

	// 	if (!result.acknowledged) {
	// 		throw new HttpException(HttpStatus.INTERNAL_SERVER_ERROR, 'Failed to update document', result);
	// 	}

	// 	if (options && options.returnResult === false) return result as TReturnDocument extends true ? WithId<Account> : UpdateResult<Account>;

	// 	const updated_doc = await this.findOne(filter, options);
	// 	if (!updated_doc) {
	// 		throw new HttpException(HttpStatus.INTERNAL_SERVER_ERROR, 'Failed to find updated document', result);
	// 	}

	// 	return updated_doc as TReturnDocument extends true ? WithId<Account> : UpdateResult<Account>;
	// }

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
