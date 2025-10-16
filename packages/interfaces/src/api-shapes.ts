/* * */

import { type Shape } from '@carrismetropolitana/api-types/network';
import { Logs } from '@tmlmobilidade/utils';

/* * */

class ApiShapesClass {
	//

	private static _instance: ApiShapesClass;

	readonly serviceUrl = 'https://api.carrismetropolitana.pt/v2/shapes';

	private serviceData = new Map<string, Shape>();

	public static getInstance() {
		if (!ApiShapesClass._instance) ApiShapesClass._instance = new ApiShapesClass();
		return ApiShapesClass._instance;
	}

	/**
	 * Get Shape by ID
	 * @param id The requested Shape ID
	 * @returns The Shape object or null if not found
	 */
	public async getShape(id: string): Promise<null | Shape> {
		// Update data if not loaded
		await this.updateData(id);
		// Extract the requested entity
		const foundEntity = this.serviceData.get(id);
		// Return requested entity to the caller
		return foundEntity ?? null;
	}

	/**
	 * Update local data from service.
	 */
	private async updateData(id: string) {
		try {
			// Return if data is already loaded
			if (this.serviceData.has(id)) return;
			// Fetch data from service
			const response = await fetch(`${this.serviceUrl}/${id}`);
			if (!response.ok) return Logs.error(response.statusText);
			// Save response data
			const data = await response.json() as Shape;
			this.serviceData.set(id, data);
		}
		catch (error) {
			Logs.error(`Error updating shapes data: ${error.message}`);
			return;
		}
	}

	//
}

/* * */

export const apiShapes = new ApiShapesClass();
