/* * */

import { z } from 'zod';

/* * */

export const CICM_CONTENT_TYPE_VALUES = ['article', 'interview', 'video'] as const;
export const MAX_CICM_FAVORITES = 500;

export const CicmContentTypeSchema = z.enum(CICM_CONTENT_TYPE_VALUES);

export const CicmFavoriteSchema = z.object({
	id: z.string().trim().min(1).max(128).regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/),
	type: CicmContentTypeSchema,
}).strict();

export const CicmFavoritesSchema = z.array(CicmFavoriteSchema).max(MAX_CICM_FAVORITES);

export type CicmFavorite = z.infer<typeof CicmFavoriteSchema>;
export type CicmFavorites = z.infer<typeof CicmFavoritesSchema>;

export const FavoritesSchema = z.object({
	cicm_content: CicmFavoritesSchema.default([]),
	line_ids: z.array(z.string()).default([]),
	stop_ids: z.array(z.string()).default([]),
});

export type Favorites = z.infer<typeof FavoritesSchema>;
