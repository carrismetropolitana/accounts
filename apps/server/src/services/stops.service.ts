import { Stop } from '@carrismetropolitana/api-types/network';
import { HttpException, HttpStatus } from '@tmlmobilidade/lib';

class StopsService {
	private static _instance: StopsService;
	readonly baseUrl: string;

	constructor(baseUrl: string) {
		this.baseUrl = baseUrl;
	}

	public static getInstance(baseUrl?: string) {
		if (!StopsService._instance) {
			if (!baseUrl) throw new Error('Base URL is required');
			StopsService._instance = new StopsService(baseUrl);
		}

		return StopsService._instance;
	}

	public async getStop(id: string): Promise<Stop> {
		const res = await fetch(`${this.baseUrl}`);

		if (!res.ok) {
			throw new HttpException(res.status, res.statusText);
		}

		const stops = await res.json() as Stop[];
		const stop = stops.find(stop => stop.id === id);

		if (!stop) {
			throw new HttpException(HttpStatus.NOT_FOUND, 'Stop not found');
		}

		return stop;
	}

	public async getStops(): Promise<Stop> {
		const res = await fetch(`${this.baseUrl}`);

		if (!res.ok) {
			throw new HttpException(res.status, res.statusText);
		}

		return await res.json() as Stop;
	}
}

export default StopsService;
