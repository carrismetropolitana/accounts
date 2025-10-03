/* * */

import { type Shape, type Stop } from '@carrismetropolitana/api-types/network';
import * as turf from '@turf/turf';
import { type Feature, type MultiPolygon, type Polygon } from 'geojson';

/**
 * Calculates the GeoFence Path from a distance the stop selected
 * @param pattern The pattern to calculate the GeoFence
 * @param stop The stop to calculate the GeoFence
 * @param notificationDistance The distance to calculate the GeoFence
 */
export function getGeofence(stopData: Stop, shapeData: Shape, distance: number): Feature<MultiPolygon | Polygon, GeoJSON.GeoJsonProperties> {
	//

	//
	// Chunk the shape into segments of 10 meters each,
	// then unify all segments into a single LineString.
	// Chunking allows greater precision when calculating the nearest point on line.

	const lineChunks = turf.lineChunk(shapeData.geojson, 10, { units: 'meters' });
	const unifiedChunks = lineChunks.features.flatMap(chunk => chunk.geometry.coordinates);

	const lineString = turf.lineString(unifiedChunks);

	//
	// For some unknown reason, cleanCoords is required
	// to avoid issues with nearestPointOnLine.

	const cleanedLineString = turf.cleanCoords(lineString);

	//
	// Detect the nearest point on the line from the stop

	const stopPoint = turf.point([Number(stopData.lon), Number(stopData.lat)]);

	const nearestPointOnLine = turf.nearestPointOnLine(cleanedLineString, stopPoint);

	//
	// Cut the line at the nearest point.
	// This will create two segments, one before the stop and one after the stop.
	// We want the segment before the stop as this will be the notification region.

	const splitShape = turf.lineSplit(lineString, nearestPointOnLine);

	//
	// Calculate the total split segment length and the initial distance to start the notification region.
	// If the distance is greater than the split segment length, we start at 0, which means the notification region
	// will be from the start of the segment to the stop.

	const splitSegmentLength = turf.length(splitShape.features[0], { units: 'meters' });
	const initialDistance = splitSegmentLength - distance >= 0 ? splitSegmentLength - distance : 0;

	const notificationRegionSegment = turf.lineSliceAlong(splitShape.features[0], initialDistance, splitSegmentLength, { units: 'meters' });

	//
	// Create a buffer of 50 meters around the notification region segment.

	return turf.buffer(notificationRegionSegment, 50, { units: 'meters' });

	//
}
