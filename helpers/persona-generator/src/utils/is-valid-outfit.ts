/* * */

import { type Outfit } from '@/categories.js';

/* * */

export function isValidOutfit(outfit: Outfit[]): boolean {
	for (const { item } of outfit) {
		if (!item?.forbidden_combinations) continue;
		for (const rule of item.forbidden_combinations) {
			const match = outfit.find(o =>
				o.category_id === rule.category_id
				&& (rule.item_id ? o.item?._id === rule.item_id : o.item !== undefined),
			);
			if (match && match.item) {
				return false;
			}
		}
	}
	return true;
}
