/* * */

import { getGeofence } from '@/get-geofence.js';
import { apiPatterns, apiShapes, apiStops } from '@carrismetropolitana/accounts-pckg-interfaces';
import { type Widget } from '@carrismetropolitana/accounts-pckg-types';
import TIMETRACKER from '@helperkits/timer';
import { Logs } from '@tmlmobilidade/utils';

/**
 * Organizes Smart Notifications for all accounts.
 * This function will:
 * - Validate that the referenced stop, pattern, and shape exist.
 * - Ensure the stop is part of the pattern and is not the first stop.
 * - Calculate a geofence around the stop based on the pattern's shape and the specified distance.
 * - Update the widget's status to 'complete' or 'error' based on the processing outcome.
 * @param widgetsData An array of Widget objects to be processed.
 * @returns An array of updated Widget objects.
 */
export async function getUpdatedWidgets(widgetsData: Widget[]): Promise<Widget[]> {
	//

	//
	// Skip processing if there are no widgets

	if (!widgetsData?.length) {
		Logs.info('[getUpdatedWidgets] No widgets received. Skipping...');
		return widgetsData;
	}

	//
	// Check if there is any smart_notification widget in the input data

	const smartNotificationWidgets = widgetsData?.filter(item => item.type === 'smart_notification');

	if (!smartNotificationWidgets?.length) {
		Logs.info('[getUpdatedWidgets] No smart_notification widgets found. Skipping...');
		return widgetsData;
	}

	//
	// Transform widgets into a Map for easier access

	const widgetsMap = new Map<string, Widget>();

	widgetsData.forEach(widget => widgetsMap.set(widget._id, widget));

	//
	// Process smart notifications

	for (const smartNotification of smartNotificationWidgets) {
		//

		const timer = new TIMETRACKER();

		//
		// Get entities needed to calculate geofence

		Logs.info(`[getUpdatedWidgets] Processing Smart Notification widget | stop_id: ${smartNotification.properties.stop_id} | pattern_id: ${smartNotification.properties.pattern_id} | distance: ${smartNotification.properties.distance}`);

		const stopData = await apiStops.getStop(smartNotification.properties.stop_id);
		const patternData = await apiPatterns.getPattern(smartNotification.properties.pattern_id);
		const shapeData = patternData ? await apiShapes.getShape(patternData.shape_id) : null;

		//
		// Validate that entities are available

		if (!stopData) {
			Logs.error(`[getUpdatedWidgets] Stop ${smartNotification.properties.stop_id} not found. Skipping this smart notification.`);
			widgetsMap.set(smartNotification._id, { ...smartNotification, status: { code: 'error', message: `STOP_NOT_FOUND` } });
			continue;
		}

		if (!patternData) {
			Logs.error(`[getUpdatedWidgets] Pattern ${smartNotification.properties.pattern_id} not found. Skipping this smart notification.`);
			widgetsMap.set(smartNotification._id, { ...smartNotification, status: { code: 'error', message: `PATTERN_NOT_FOUND` } });
			continue;
		}

		if (!shapeData) {
			Logs.error(`[getUpdatedWidgets] Shape ${patternData.shape_id} not found. Skipping this smart notification.`);
			widgetsMap.set(smartNotification._id, { ...smartNotification, status: { code: 'error', message: `SHAPE_NOT_FOUND` } });
			continue;
		}

		//
		// Validate that stop is in pattern and is not the first stop

		const sortedPath = patternData.path.sort((a, b) => a.stop_sequence - b.stop_sequence);
		const firstWaypointInPath = sortedPath[0];
		const stopIndexInPattern = sortedPath.findIndex(path => path.stop_id === smartNotification.properties.stop_id && path.stop_sequence > firstWaypointInPath.stop_sequence);

		if (stopIndexInPattern < 0) {
			Logs.error(`[getUpdatedWidgets] Stop ${smartNotification.properties.stop_id} is not in Pattern ${patternData.id}. Skipping...`);
			widgetsMap.set(smartNotification._id, { ...smartNotification, status: { code: 'error', message: `STOP_NOT_IN_PATTERN` } });
			continue;
		}

		if (stopIndexInPattern === 0) {
			Logs.error(`[getUpdatedWidgets] Stop ${smartNotification.properties.stop_id} is the first stop in Pattern ${patternData.id}. Skipping...`);
			widgetsMap.set(smartNotification._id, { ...smartNotification, status: { code: 'error', message: `STOP_IS_FIRST_WAYPOINT` } });
			continue;
		}

		//
		// Calculate the geofence buffer

		const geofenceData = getGeofence(stopData, shapeData, smartNotification.properties.distance);

		if (!geofenceData) {
			Logs.error(`[getUpdatedWidgets] Could not calculate geofence for Stop ${smartNotification.properties.stop_id} in Pattern ${patternData.id}. Skipping...`);
			widgetsMap.set(smartNotification._id, { ...smartNotification, status: { code: 'error', message: `GEOFENCE_UNAVAILABLE` } });
			continue;
		}

		//
		// Save the updated smart notification

		smartNotification.properties.geojson = geofenceData;
		smartNotification.status = { code: 'complete', message: null };

		widgetsMap.set(smartNotification._id, smartNotification);

		Logs.success(`[getUpdatedWidgets] Smart notification ${smartNotification._id} processed successfully in ${timer.get()}.`);

		//
	}

	//
	// Save the updated widgets back to the account

	return Array.from(widgetsMap.values());

	//
}
