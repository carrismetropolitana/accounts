/* * */

import { type Pattern } from '@carrismetropolitana/api-types/network';
import { Dates, Logs } from '@tmlmobilidade/utils';

/* * */

class ApiPatternsClass {
	//

	private static _instance: ApiPatternsClass;

	readonly serviceUrl = 'https://api.carrismetropolitana.pt/v2/patterns';

	private serviceData = new Map<string, Pattern[]>();

	public static getInstance() {
		if (!ApiPatternsClass._instance) ApiPatternsClass._instance = new ApiPatternsClass();
		return ApiPatternsClass._instance;
	}

	/**
	 * Get Pattern by ID
	 * @param id The requested Pattern ID
	 * @returns The Pattern object or null if not found
	 */
	public async getPattern(id: string): Promise<null | Pattern> {
		// Update data if not loaded
		await this.updateData(id);
		// Extract the requested entity
		const foundEntity = this.serviceData.get(id);
		// Return null if no entity found
		if (!foundEntity?.length) return null;
		// Get the current date as operational date
		const todayAsOperationalDate = Dates
			.now('Europe/Lisbon')
			.set({ hour: 12 })
			.operational_date;
		const activePatterns: Pattern[] = [];
		let closestDateSoFar: null | string = null;
		let patternGroupWithClosestDate: null | Pattern = null;
		for (const patternGroup of foundEntity) {
			const selectedDate = todayAsOperationalDate;
			if (!selectedDate) return;
			// Find the closest valid date
			const closestDate = patternGroup.valid_on.reduce((acc, curr) => {
				if (selectedDate <= curr && (acc === '' || curr < acc)) return curr;
				return acc;
			}, '');
			if (!closestDateSoFar) closestDateSoFar = closestDate;
			if (closestDate && closestDate <= closestDateSoFar) {
				patternGroupWithClosestDate = patternGroup;
				closestDateSoFar = closestDate;
			}
		}
		// If the closest date is valid, add the pattern group to the list
		if (patternGroupWithClosestDate && !activePatterns.find(activePattern => activePattern.id === patternGroupWithClosestDate.id)) {
			return patternGroupWithClosestDate;
		}
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
			const data = await response.json() as Pattern[];
			this.serviceData.set(id, data);
		}
		catch (error) {
			Logs.error(`Error updating patterns data: ${error.message}`);
			return;
		}
	}

	//
}

/* * */

export const apiPatterns = new ApiPatternsClass();
