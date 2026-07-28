import assert from 'node:assert/strict';
import test from 'node:test';

import {
	buildAccountUpdatePreservingCicmFavorites,
	buildAddCicmFavoriteUpdate,
	buildImportCicmFavoritesUpdate,
	buildRemoveCicmFavoriteUpdate,
} from '../src/accounts.js';

const favorite = { id: 'article-42', type: 'article' } as const;
const updatedAt = 1_722_556_800;

test('CICM mutations derive favorites from the document being updated', () => {
	const addUpdate = buildAddCicmFavoriteUpdate(favorite, updatedAt);
	const importUpdate = buildImportCicmFavoritesUpdate([favorite], updatedAt);
	const removeUpdate = buildRemoveCicmFavoriteUpdate(favorite, updatedAt);

	assert.deepEqual(getFavorites(addUpdate), cicmFavoritesMerge({
		$setUnion: [{ $ifNull: ['$favorites.cicm_content', []] }, [favorite]],
	}));
	assert.deepEqual(getFavorites(importUpdate), cicmFavoritesMerge({
		$setUnion: [{ $ifNull: ['$favorites.cicm_content', []] }, [favorite]],
	}));
	assert.deepEqual(getFavorites(removeUpdate), cicmFavoritesMerge({
		$filter: {
			as: 'favorite',
			cond: {
				$not: [{
					$and: [
						{ $eq: ['$$favorite.type', 'article'] },
						{ $eq: ['$$favorite.id', 'article-42'] },
					],
				}],
			},
			input: { $ifNull: ['$favorites.cicm_content', []] },
		},
	}));
});

test('ordinary account updates retain CICM favorites while applying line and stop changes', () => {
	const update = buildAccountUpdatePreservingCicmFavorites({
		favorites: { cicm_content: [], line_ids: ['1001'], stop_ids: ['060001'] },
	}, updatedAt);

	assert.deepEqual(getFavorites(update), {
		$mergeObjects: [
			{ cicm_content: [], line_ids: [], stop_ids: [] },
			{ $ifNull: ['$favorites', {}] },
			{ line_ids: { $literal: ['1001'] }, stop_ids: { $literal: ['060001'] } },
			{ cicm_content: { $ifNull: ['$favorites.cicm_content', []] } },
		],
	});
});

function cicmFavoritesMerge(cicmContent: Record<string, unknown>): Record<string, unknown> {
	return {
		$mergeObjects: [
			{ cicm_content: [], line_ids: [], stop_ids: [] },
			{ $ifNull: ['$favorites', {}] },
			{ cicm_content: cicmContent },
		],
	};
}

function getFavorites(update: Record<string, unknown>[]): unknown {
	const stage = update[0];
	if (!stage) throw new Error('Expected a MongoDB update stage');
	const set = getRecord(stage.$set);
	return set.favorites;
}

function getRecord(value: unknown): Record<string, unknown> {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		throw new Error('Expected a MongoDB document');
	}
	return value as Record<string, unknown>;
}
