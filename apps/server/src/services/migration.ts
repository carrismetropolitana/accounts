/* * */

import { getRandomPersonaImageId } from '@/services/personas.js';
import { type Account, AccountSchema, WidgetSchema } from '@carrismetropolitana/accounts-types';
import { Dates, generateRandomString } from '@tmlmobilidade/utils';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function migrateAccountToLatestVersion(oldAccount: any, deviceId: string): Account {
	//

	//
	// Generate a random persona image

	const personaImageId = oldAccount.profile.profile_image
		? oldAccount.profile.profile_image.replace('.png', '')
		: getRandomPersonaImageId();

	//
	// Initiate an empty account object with default values

	const newAccount = AccountSchema
		.omit({ _id: true })
		.parse({
			created_at: oldAccount.created_at ? oldAccount.created_at : Dates.now('Europe/Lisbon').unix_timestamp,
			devices: [{ device_id: deviceId }],
			persona: { image_id: personaImageId },
			updated_at: Dates.now('Europe/Lisbon').unix_timestamp,
		});

	//
	// Migrate properties from the old account to the new account

	if (oldAccount.favorites?.lines?.length) newAccount.favorites.line_ids = oldAccount.favorites.lines;
	if (oldAccount.favorites?.stops?.length) newAccount.favorites.stop_ids = oldAccount.favorites.stops;

	if (oldAccount.profile?.email) newAccount.profile.email = oldAccount.profile.email;
	if (oldAccount.profile?.phone) newAccount.profile.phone = oldAccount.profile.phone;
	if (oldAccount.profile?.first_name) newAccount.profile.first_name = oldAccount.profile.first_name;
	if (oldAccount.profile?.last_name) newAccount.profile.last_name = oldAccount.profile.last_name;
	if (oldAccount.profile?.activity) newAccount.profile.activity = oldAccount.profile.activity;
	if (oldAccount.profile?.utilization_type) newAccount.profile.utilization_type = oldAccount.profile.utilization_type;

	if (oldAccount.widgets?.length) {
		oldAccount.widgets.forEach((originalWidget) => {
			//

			if (originalWidget.data?.type === 'lines') {
				// Validate necessary data exists
				if (!originalWidget.data) return;
				if (!originalWidget.data?.pattern_id) return;
				// Create new widget
				const newWidget = WidgetSchema.parse({
					_id: generateRandomString(),
					properties: {
						pattern_id: originalWidget.data?.pattern_id,
					},
					type: 'line',
				});
				// Add to new account
				newAccount.widgets.push(newWidget);
			}

			if (originalWidget.data?.type === 'stops') {
				// Validate necessary data exists
				if (!originalWidget.data) return;
				if (!originalWidget.data?.stop_id) return;
				if (!originalWidget.data?.pattern_ids?.length) return;
				// Create new widget
				const newWidget = WidgetSchema.parse({
					_id: generateRandomString(),
					properties: {
						pattern_ids: originalWidget.data.pattern_ids,
						stop_id: originalWidget.data.stop_id,
					},
					type: 'stop',
				});
				// Add to new account
				newAccount.widgets.push(newWidget);
			}

			if (originalWidget.data?.type === 'smart_notification') {
				// Validate necessary data exists
				if (!originalWidget.data) return;
				if (!originalWidget.data?.distance) return;
				if (!originalWidget.data?.start_time) return;
				if (!originalWidget.data?.end_time) return;
				if (!originalWidget.data?.pattern_id) return;
				if (!originalWidget.data?.stop_id) return;
				if (!originalWidget.data?.week_days?.length) return;
				// Parse time ranges
				let parsedStartTime = 0;
				if (originalWidget.data.start_time >= 0 && originalWidget.data.start_time < 86400) parsedStartTime = originalWidget.data.start_time;
				let parsedEndTime = 86399;
				if (originalWidget.data.end_time >= 0 && originalWidget.data.end_time < 86400) parsedEndTime = originalWidget.data.end_time;
				// Check if they overlap
				if (parsedStartTime >= parsedEndTime) parsedEndTime = parsedStartTime + 1800;
				// If end time exceeds 86400, set to 86400
				if (parsedEndTime >= 86400) parsedEndTime = 86399;
				// Create new widget
				const newWidget = WidgetSchema.parse({
					_id: generateRandomString(),
					properties: {
						distance: originalWidget.data.distance >= 500 ? originalWidget.data.distance : 500,
						end_time: parsedEndTime,
						pattern_id: originalWidget.data.pattern_id,
						start_time: parsedStartTime,
						stop_id: originalWidget.data.stop_id,
						weekdays: originalWidget.data.week_days,
					},
					type: 'smart_notification',
				});
				// Add to new account
				newAccount.widgets.push(newWidget);
			}

			//
		});
	}

	return newAccount;

	//
}
