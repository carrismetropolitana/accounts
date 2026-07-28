/* * */

import {
	type Account,
	type AccountCreateDto,
	AccountSchema,
	type AccountUpdateDto,
	type CicmFavorite,
	CicmFavoritesSchema,
	MAX_CICM_FAVORITES,
	UpdateAccountSchema,
} from '@carrismetropolitana/accounts-pckg-types';
import { type Filter, type IndexDescription, MongoCollectionClass } from '@tmlmobilidade/interfaces';
import { HttpException, HttpStatus } from '@tmlmobilidade/lib';
import { AsyncSingletonProxy, Dates } from '@tmlmobilidade/utils';

type MongoUpdatePipeline = Record<string, unknown>[];
const ACCOUNT_UPDATE_EXCLUDED_FIELDS = new Set(['_id', 'created_at', 'favorites', 'updated_at']);

export function buildAccountUpdatePreservingCicmFavorites(
	account: AccountUpdateDto,
	updatedAt: number,
): MongoUpdatePipeline {
	const accountFields = Object.fromEntries(
		Object.entries(account)
			.filter(([key, value]) => !ACCOUNT_UPDATE_EXCLUDED_FIELDS.has(key) && value !== undefined)
			.map(([key, value]) => [key, { $literal: value }]),
	);
	const incomingFavorites = account.favorites;
	const favoriteFields = incomingFavorites
		? {
			line_ids: { $literal: incomingFavorites.line_ids },
			stop_ids: { $literal: incomingFavorites.stop_ids },
		}
		: {};

	return [{
		$set: {
			...accountFields,
			...(incomingFavorites
				? {
					favorites: {
						$mergeObjects: [
							{ cicm_content: [], line_ids: [], stop_ids: [] },
							{ $ifNull: ['$favorites', {}] },
							favoriteFields,
							{ cicm_content: currentCicmFavoritesExpression() },
						],
					},
				}
				: {}),
			updated_at: { $literal: updatedAt },
		},
	}];
}

export function buildAddCicmFavoriteUpdate(favorite: CicmFavorite, updatedAt: number): MongoUpdatePipeline {
	return buildCicmFavoritesUpdate({ $setUnion: [currentCicmFavoritesExpression(), [favorite]] }, updatedAt);
}

export function buildImportCicmFavoritesUpdate(favorites: CicmFavorite[], updatedAt: number): MongoUpdatePipeline {
	return buildCicmFavoritesUpdate({ $setUnion: [currentCicmFavoritesExpression(), favorites] }, updatedAt);
}

export function buildRemoveCicmFavoriteUpdate(favorite: CicmFavorite, updatedAt: number): MongoUpdatePipeline {
	return buildCicmFavoritesUpdate({
		$filter: {
			as: 'favorite',
			cond: {
				$not: [{
					$and: [
						{ $eq: ['$$favorite.type', favorite.type] },
						{ $eq: ['$$favorite.id', favorite.id] },
					],
				}],
			},
			input: currentCicmFavoritesExpression(),
		},
	}, updatedAt);
}

function buildCicmFavoritesUpdate(cicmFavorites: Record<string, unknown>, updatedAt: number): MongoUpdatePipeline {
	return [{
		$set: {
			favorites: {
				$mergeObjects: [
					{ cicm_content: [], line_ids: [], stop_ids: [] },
					{ $ifNull: ['$favorites', {}] },
					{ cicm_content: cicmFavorites },
				],
			},
			updated_at: updatedAt,
		},
	}];
}

function buildCicmFavoritesCapacityExpression(candidates: CicmFavorite[]): Record<string, unknown> {
	return {
		$lte: [
			{ $size: { $setUnion: [currentCicmFavoritesExpression(), candidates] } },
			MAX_CICM_FAVORITES,
		],
	};
}

function currentCicmFavoritesExpression(): Record<string, unknown> {
	return { $ifNull: ['$favorites.cicm_content', []] };
}

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

	async addCicmFavorite(deviceId: string, favorite: CicmFavorite): Promise<CicmFavorite[]> {
		await this.ensureCicmAccount(deviceId);
		return this.updateCicmFavorites(deviceId, buildAddCicmFavoriteUpdate(favorite, Dates.now('utc').unix_timestamp), [favorite]);
	}

	/**
	 * Finds an account document by its device ID.
	 * @param deviceId The device ID of the document to find.
	 * @returns A promise that resolves to the matching document or null if none exists.
	 */
	async findByDeviceId(deviceId: string): Promise<Account | null> {
		const foundAccount = await this.mongoCollection.findOne({ 'devices.device_id': { $eq: deviceId } });
		if (!foundAccount) return null;
		return foundAccount;
	}

	async getCicmFavorites(deviceId: string): Promise<CicmFavorite[]> {
		const account = await this.findByDeviceId(deviceId);
		const parsedFavorites = CicmFavoritesSchema.safeParse(account?.favorites?.cicm_content ?? []);
		return parsedFavorites.success ? parsedFavorites.data : [];
	}

	async importCicmFavorites(deviceId: string, favorites: CicmFavorite[]): Promise<CicmFavorite[]> {
		await this.ensureCicmAccount(deviceId);
		return this.updateCicmFavorites(deviceId, buildImportCicmFavoritesUpdate(favorites, Dates.now('utc').unix_timestamp), favorites);
	}

	async removeCicmFavorite(deviceId: string, favorite: CicmFavorite): Promise<CicmFavorite[]> {
		if (!(await this.findByDeviceId(deviceId))) return [];
		return this.updateCicmFavorites(deviceId, buildRemoveCicmFavoriteUpdate(favorite, Dates.now('utc').unix_timestamp));
	}

	async updateAccountPreservingCicmFavorites(accountId: string, account: AccountUpdateDto): Promise<Account> {
		const updatedAccount = await this.mongoCollection.findOneAndUpdate(
			{ _id: accountId } as unknown as Filter<Account>,
			buildAccountUpdatePreservingCicmFavorites(account, Dates.now('utc').unix_timestamp),
			{ returnDocument: 'after' },
		);
		if (!updatedAccount) throw new HttpException(HttpStatus.INTERNAL_SERVER_ERROR, 'Failed to update account');
		return updatedAccount;
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

	private async ensureCicmAccount(deviceId: string): Promise<void> {
		if (await this.findByDeviceId(deviceId)) return;

		try {
			await this.insertOne(AccountSchema.parse({
				created_at: Dates.now('utc').unix_timestamp,
				devices: [{ device_id: deviceId }],
				updated_at: Dates.now('utc').unix_timestamp,
			}), { unsafe: true });
		}
		catch (error) {
			if (!(await this.findByDeviceId(deviceId))) throw error;
		}
	}

	private async updateCicmFavorites(
		deviceId: string,
		update: MongoUpdatePipeline,
		candidates?: CicmFavorite[],
	): Promise<CicmFavorite[]> {
		const filter = {
			'devices.device_id': deviceId,
			...(candidates ? { $expr: buildCicmFavoritesCapacityExpression(candidates) } : {}),
		} as unknown as Filter<Account>;
		const updatedAccount = await this.mongoCollection.findOneAndUpdate(filter, update, { returnDocument: 'after' });
		if (!updatedAccount) {
			const currentFavorites = await this.getCicmFavorites(deviceId);
			if (candidates && new Set([...currentFavorites, ...candidates].map(favorite => `${favorite.type}:${favorite.id}`)).size > MAX_CICM_FAVORITES) {
				throw new HttpException(
					HttpStatus.UNPROCESSABLE_ENTITY,
					`An account cannot have more than ${MAX_CICM_FAVORITES} CICM favorites`,
				);
			}
			throw new HttpException(HttpStatus.INTERNAL_SERVER_ERROR, 'Failed to update CICM favorites');
		}

		const parsedFavorites = CicmFavoritesSchema.safeParse(updatedAccount.favorites?.cicm_content ?? []);
		if (!parsedFavorites.success) {
			throw new HttpException(HttpStatus.INTERNAL_SERVER_ERROR, 'Invalid CICM favorites stored in account');
		}
		return parsedFavorites.data;
	}

	//
}

/* * */

export const accounts = AsyncSingletonProxy(AccountsClass);
