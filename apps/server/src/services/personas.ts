/* * */

import fs from 'node:fs';

/**
 * Retrieves a random persona image ID from the available images.
 * @returns A random persona image ID.
 */
export function getRandomPersonaImageId(): string {
	const imagesDir = '/app/dist/public/personas';
	const availableImages = fs.readdirSync(imagesDir);
	const randomIndex = Math.floor(Math.random() * availableImages.length);
	const randomSelection = availableImages[randomIndex];
	const randomSelectionId = randomSelection.replace('.png', '');
	return randomSelectionId;
}
