/* * */

import { categories } from '@/categories.js';
import { generateCombinations } from '@/utils/generate-cartesian-product.js';
import { isValidOutfit } from '@/utils/is-valid-outfit.js';
import LOGGER from '@helperkits/logger';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

/* * */

const outputDir = './output';
const imagesBaseDir = './assets';

/* * */

(async () => {
	//

	LOGGER.init();

	LOGGER.info(`Starting persona generation...`);

	//
	// Ensure output dir exists

	if (fs.existsSync(outputDir)) {
		// LOGGER.error(`Output directory already exists. Please clear it first: ${outputDir}`);
		// process.exit(1);
		fs.rmSync(outputDir, { recursive: true });
	}

	fs.mkdirSync(outputDir, { recursive: true });

	//
	// Generate all the possible combinations for the existing categories.
	// Take into account that each category can have an empty state,
	// and that some combinations are forbidden. A combination is the concatenation
	// of items for each category.

	const allOutfitCombinations = generateCombinations(categories);

	const validOutfitCombinations = allOutfitCombinations
		.filter(isValidOutfit)
		.map(item => ({ data: item.filter(i => i.item), outfit_id: item.map(i => i.item ? `${i.category_id}-${i.item._id}` : null).filter(Boolean).join('|') }))
		.sort((a, b) => a.outfit_id.localeCompare(b.outfit_id));

	LOGGER.title(`Generating ${validOutfitCombinations.length} outfit combinations...`);

	//
	// For each combination, build the layers
	// and export the image using the sharp package

	for (const [index, outfitData] of validOutfitCombinations.entries()) {
		//

		//
		// Build the actual layers

		// let outfitId: string;

		const compositeLayers: { input: Buffer, order: number }[] = [];

		for (const layerData of outfitData.data) {
			// Skip if no item is selected
			if (!layerData.item) continue;
			// Add this layer ID to the outfit ID string
			// outfitId = outfitId ? `${outfitId}|${layerData.category_id}-${layerData.item._id}` : `${layerData.category_id}-${layerData.item._id}`;
			// Process each image for the selected item
			for (const imageData of layerData.item.images) {
				// Build the asset path
				const imagePath = path.join(imagesBaseDir, layerData.category_id, imageData.filename);
				// Process this image with sharp
				const layerBuffer = await sharp(imagePath)
					.resize(1000, 1000, { fit: 'contain' })
					.toBuffer();
				// Add this layer the array
				compositeLayers.push({ input: layerBuffer, order: imageData.order });
			}
		}

		//
		// Sort the layers by the 'order' property

		const sortedLayers = compositeLayers
			.sort((a, b) => a.order - b.order)
			.map(item => ({ input: item.input, left: 0, top: 0 }));

		//
		// Composite the layers using the sharp package.
		// Start with a transparent canvas of 1000x1000 pixels.

		const transparentCanvas = sharp({
			create: {
				background: { alpha: 0, b: 0, g: 0, r: 0 },
				channels: 4,
				height: 1000,
				width: 1000,
			},
		});

		const outputComposite = transparentCanvas.composite(sortedLayers);

		const outputFilePath = path.join(outputDir, `${outfitData.outfit_id}.png`);
		await outputComposite.png().toFile(outputFilePath);

		LOGGER.info(`[${index + 1}/${validOutfitCombinations.length}] ${outfitData.outfit_id}`);

		//
	}

	//
})();
