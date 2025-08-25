import { Shape } from '@carrismetropolitana/api-types/network';
import { HttpException } from '@tmlmobilidade/lib';

class ShapeService {
	private static _instance: ShapeService;
	readonly baseUrl: string;

	constructor(baseUrl: string) {
		this.baseUrl = baseUrl;
	}

	public static getInstance(baseUrl?: string) {
		if (!ShapeService._instance) {
			if (!baseUrl) throw new Error('Base URL is required');
			ShapeService._instance = new ShapeService(baseUrl);
		}

		return ShapeService._instance;
	}

	public async getShape(id: string): Promise<Shape> {
		const res = await fetch(`${this.baseUrl}/${id}`);

		if (!res.ok) {
			throw new HttpException(res.status, res.statusText);
		}

		return await res.json() as Shape;
	}

	public async getShapes(): Promise<Shape> {
		const res = await fetch(`${this.baseUrl}`);

		if (!res.ok) {
			throw new HttpException(res.status, res.statusText);
		}

		return await res.json() as Shape;
	}
}

export default ShapeService;
