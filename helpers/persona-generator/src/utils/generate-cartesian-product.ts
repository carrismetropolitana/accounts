/* * */

import { type Category, type CategoryItem, type Outfit } from '@/categories.js';

/**
 * Generate all possible combinations of outfits from the given categories.
 * @param categories The categories to generate combinations from.
 * @returns An array of outfit combinations.
 */
export function generateCombinations(categories: Category[]): Outfit[][] {
	function helper(index: number): Outfit[][] {
		// Base case: all categories have been processed
		if (index === categories.length) return [[]];
		// Recursive case: process the current category
		const category = categories[index];
		const options: (CategoryItem | undefined)[] = category.allow_empty
			? [undefined, ...category.items]
			: [...category.items];
		// Get the combinations for the remaining categories
		const rest = helper(index + 1);
		const results: Outfit[][] = [];
		// Combine the current category options
		// with the remaining combinations
		for (const option of options) {
			for (const r of rest) {
				results.push([{ category_id: category._id, item: option }, ...r]);
			}
		}
		// Return the final results
		return results;
	}
	// Start the recursion
	return helper(0);
}
