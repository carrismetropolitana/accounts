/* * */

import { type Stop } from '@carrismetropolitana/api-types/network';

/* * */

class ApiStopsClass {
	//

	private static _instance: ApiStopsClass;

	readonly serviceUrl = 'https://api.carrismetropolitana.pt/v2/stops';

	private serviceData: Stop[] = [];

	public static getInstance() {
		if (!ApiStopsClass._instance) ApiStopsClass._instance = new ApiStopsClass();
		return ApiStopsClass._instance;
	}

	/**
	 * Get Stop by ID
	 * @param id The requested Stop ID
	 * @returns The Stop object or null if not found
	 */
	public async getStop(id: string): Promise<null | Stop> {
		// Update data if not loaded
		await this.updateData();
		// Extract the requested entity
		const foundEntity = this.serviceData.find(stop => stop.id === id);
		// Return requested entity to the caller
		return foundEntity ?? null;
	}

	/**
	 * Get all Stops
	 * @returns Array of Stops
	 */
	public async getStops(): Promise<Stop[]> {
		// Update data if not loaded
		await this.updateData();
		// Return requested entity to the caller
		return this.serviceData;
	}

	/**
	 * Update local data from service.
	 */
	private async updateData() {
		try {
			// Return if data is already loaded
			if (this.serviceData?.length) return;
			// Fetch data from service
			const response = await fetch(this.serviceUrl);
			if (!response.ok) throw new Error(response.statusText);
			// Save response data
			this.serviceData = await response.json() as Stop[];
		}
		catch (error) {
			throw new Error(`Error updating stops data: ${error.message}`);
		}
	}

	//
}

/* * */

export const apiStops = new ApiStopsClass();
