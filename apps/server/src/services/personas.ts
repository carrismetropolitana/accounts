/* * */

import { availablePersonaImageIds } from './persona_ids.js';

/**
 * Retrieves a random persona image ID from the available images.
 * @returns A random persona image ID.
 */
export function getRandomPersonaImageId(): string {
	const randomIndex = Math.floor(Math.random() * availablePersonaImageIds.length);
	return availablePersonaImageIds[randomIndex];
}
