import ShapeService from '@/services/shape.service';
import StopsService from '@/services/stops.service';
import { Pattern } from '@carrismetropolitana/api-types/network';
import { HttpException, HttpStatus } from '@tmlmobilidade/lib';
import * as turf from '@turf/turf';
import { Feature, LineString, MultiPolygon, Polygon, Position } from 'geojson';

/**
 * Calculates the GeoFence Path from a distance the stop selected
 * @param pattern The pattern to calculate the GeoFence
 * @param stopId The stop id to calculate the GeoFence
 * @param notificationDistance The distance to calculate the GeoFence
 */
export async function calculateGeoFence(pattern: Pattern, stopId: string, notificationDistance: number): Promise<Feature<MultiPolygon | Polygon, GeoJSON.GeoJsonProperties>> {
	// Find Stop in pattern
	const stop = pattern.path.find(path => path.stop_id === stopId);

	if (!stop) throw new HttpException(HttpStatus.NOT_FOUND, `Stop ${stopId} not found in pattern ${pattern.id}`);
	if (stop.stop_sequence <= 1) throw new HttpException(HttpStatus.BAD_REQUEST, `Stop ${stopId} is the first stop in pattern ${pattern.id}`);

	const stopData = await StopsService.getInstance().getStop(stop.stop_id);

	// Find shape in pattern
	const shape = await ShapeService.getInstance().getShape(pattern.shape_id);
	if (!shape) throw new HttpException(HttpStatus.NOT_FOUND, `Shape ${pattern.shape_id} not found`);

	const shapeCoordinates = shape.geojson;
	const shapeTurf = turf.lineChunk(shapeCoordinates, 10, { units: 'meters' });

	// Merge all shapeTurf Features into 1 LineString
	const coordinates: Position[] = [];
	shapeTurf.features.forEach((feature: Feature<LineString>) => {
		coordinates.push(...feature.geometry.coordinates);
	});

	const feature = turf.cleanCoords(turf.lineString(coordinates));

	const point = turf.point([Number(stopData.lon), Number(stopData.lat)]);
	const nearestPointOnLine = turf.nearestPointOnLine(feature, point);

	const split = turf.lineSplit(feature, nearestPointOnLine);
	const stopDistance = turf.length(split.features[0], { units: 'meters' });
	const lineSliceAlong = turf.lineSliceAlong(split.features[0], stopDistance - notificationDistance, stopDistance, { units: 'meters' });

	return turf.buffer(lineSliceAlong, 20, { units: 'meters' });
}
