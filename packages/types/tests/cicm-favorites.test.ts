import assert from 'node:assert/strict';
import test from 'node:test';

import {
	CicmFavoriteSchema,
	CicmFavoritesSchema,
	MAX_CICM_FAVORITES,
} from '../src/favorites.js';

const favorite = { id: 'article-42', type: 'article' } as const;

test('CICM favorites accept the frontend content identities and reject malformed values', () => {
	for (const supportedFavorite of [
		favorite,
		{ id: 'video-42', type: 'video' },
		{ id: 'interview-42', type: 'interview' },
	]) {
		assert.equal(CicmFavoriteSchema.safeParse(supportedFavorite).success, true);
	}

	assert.equal(
		CicmFavoriteSchema.safeParse({ id: 'article/42', type: 'article' }).success,
		false,
	);
	assert.equal(
		CicmFavoriteSchema.safeParse({ id: 'article-42', type: 'report' }).success,
		false,
	);
});

test('CICM favorites are capped at 500 entries', () => {
	const favoritesAtLimit = Array.from(
		{ length: MAX_CICM_FAVORITES },
		(_, index) => ({ id: `article-${index}`, type: 'article' as const }),
	);
	const favoritesAboveLimit = [
		...favoritesAtLimit,
		{ id: 'article-overflow', type: 'article' as const },
	];

	assert.equal(CicmFavoritesSchema.safeParse(favoritesAtLimit).success, true);
	assert.equal(CicmFavoritesSchema.safeParse(favoritesAboveLimit).success, false);
});
