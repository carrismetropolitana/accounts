/* * */

import { calculateGeoFence } from '@/geofence';
import { accounts, apiPatterns, apiShapes, apiStops } from '@carrismetropolitana/accounts-interfaces';
import { type Account, type Widget } from '@carrismetropolitana/accounts-types';
import TIMETRACKER from '@helperkits/timer';
import { Logs } from '@tmlmobilidade/utils';

/**
 * Organizes Smart Notifications for all accounts.
 * This function will:
 * - Stream all accounts
 * - For each account, check if it has any smart_notification widgets
 * - For each smart_notification widget, validate the stop, pattern, and shape
 * - Calculate the geofence for the smart_notification
 * - Update the smart_notification widget with the new geofence
 * - Save the updated account back to the database
 */
async function organizeSmartNotifications() {
	//

	Logs.init();

	const globalTimer = new TIMETRACKER();

	//
	// Stream all Account documents

	const accountsCollection = await accounts.getCollection();
	const accountsStream = accountsCollection.find().stream();

	//
	// Loop through all Account documents
	// and ensure their smart notifications are organized

	for await (const accountItem of accountsStream) {
		//

		const accountData: Account = accountItem;

		//
		// Check that this account has any smart_notification widget

		const smartNotificationWidgets = accountData.widgets?.filter(item => item.type === 'smart_notification');

		if (!smartNotificationWidgets || smartNotificationWidgets.length === 0) {
			Logs.error(`Account ${accountData._id} does not have any smart_notification widgets. Skipping.`);
			continue;
		}

		//
		// Transform widgets into a Map for easier access

		const widgetsMap = new Map<string, Widget>();

		accountData.widgets.forEach(widget => widgetsMap.set(widget._id, widget));

		//
		// Process smart notifications

		Logs.info(`Processing Account ${accountData._id} with ${smartNotificationWidgets.length} smart_notification widgets...`);

		for (const smartNotification of smartNotificationWidgets) {
			//

			//
			// Get entities needed to calculate geofence

			const stopData = await apiStops.getStop(smartNotification.properties.stop_id);
			const patternData = await apiPatterns.getPattern(smartNotification.properties.pattern_id);
			const shapeData = patternData ? await apiShapes.getShape(patternData.shape_id) : null;

			//
			// Validate that entities are available

			if (!stopData) {
				Logs.error(`Stop ${smartNotification.properties.stop_id} not found for Account ${accountData._id}. Skipping this smart notification.`);
				widgetsMap.set(smartNotification._id, { ...smartNotification, status: { code: 'error', message: `STOP_NOT_FOUND` } });
				continue;
			}

			if (!patternData) {
				Logs.error(`Pattern ${smartNotification.properties.pattern_id} not found for Account ${accountData._id}. Skipping this smart notification.`);
				widgetsMap.set(smartNotification._id, { ...smartNotification, status: { code: 'error', message: `PATTERN_NOT_FOUND` } });
				continue;
			}

			if (!shapeData) {
				Logs.error(`Shape ${patternData.shape_id} not found for Account ${accountData._id}. Skipping this smart notification.`);
				widgetsMap.set(smartNotification._id, { ...smartNotification, status: { code: 'error', message: `SHAPE_NOT_FOUND` } });
				continue;
			}

			//
			// Validate that stop is in pattern and is not the first stop

			const sortedPath = patternData.path.sort((a, b) => a.stop_sequence - b.stop_sequence);
			const stopIndexInPattern = sortedPath.findIndex(path => path.stop_id === smartNotification.properties.stop_id && path.stop_sequence === smartNotification.properties.stop_sequence);

			if (stopIndexInPattern < 0) {
				Logs.error(`Stop ${smartNotification.properties.stop_id} is not in Pattern ${patternData.id} for Account ${accountData._id}. Skipping this smart notification.`);
				widgetsMap.set(smartNotification._id, { ...smartNotification, status: { code: 'error', message: `STOP_NOT_IN_PATTERN` } });
				continue;
			}

			if (stopIndexInPattern === 0) {
				Logs.error(`Stop ${smartNotification.properties.stop_id} is the first stop in Pattern ${patternData.id} for Account ${accountData._id}. Skipping this smart notification.`);
				widgetsMap.set(smartNotification._id, { ...smartNotification, status: { code: 'error', message: `STOP_IS_FIRST` } });
				continue;
			}

			//
			// Calculate the geofence buffer

			const geofenceData = calculateGeoFence(stopData, patternData, shapeData, smartNotification.properties.distance);

			if (!geofenceData) {
				Logs.error(`Could not calculate geofence for Stop ${smartNotification.properties.stop_id} in Pattern ${patternData.id} for Account ${accountData._id}. Skipping this smart notification.`);
				widgetsMap.set(smartNotification._id, { ...smartNotification, status: { code: 'error', message: `GEOFENCE_NOT_FOUND` } });
				continue;
			}

			//
			// Save the updated smart notification

			widgetsMap.set(smartNotification._id, {
				...smartNotification,
				properties: {
					...smartNotification.properties,
					geojson: geofenceData,
				},
				status: {
					code: 'complete',
					message: null,
				},
			});

			Logs.success(`Smart notification ${smartNotification._id} for Account ${accountData._id} processed successfully.`);

			//
		}

		//
		// Save the updated widgets back to the account

		accountData.widgets = Array.from(widgetsMap.values());

		await accounts.updateById(accountData._id, { widgets: accountData.widgets });

		Logs.success(`Account ${accountData._id} updated successfully with organized smart notifications.`);

		//
	}

	Logs.terminate(`Organization completed in ${globalTimer.get()}`);

	//
}

/* * */

(async function init() {
	const runOnInterval = async () => {
		await organizeSmartNotifications();
		setTimeout(runOnInterval, 300_000); // 5 minutes in milliseconds
	};
	runOnInterval();
})();
