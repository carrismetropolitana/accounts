/* * */

import { accounts } from '@carrismetropolitana/accounts-pckg-interfaces';
import { type Account } from '@carrismetropolitana/accounts-pckg-types';
import { getUpdatedWidgets } from '@carrismetropolitana/accounts-pckg-utils';
import TIMETRACKER from '@helperkits/timer';
import { Logs } from '@tmlmobilidade/utils';

/**
 * Organize all account's widgets on an interval.
 */
async function organizeWidgets() {
	//

	Logs.init();

	const globalTimer = new TIMETRACKER();

	//
	// Stream all Account documents

	const accountsCollection = await accounts.getCollection();
	const accountsStream = accountsCollection.find({
		'_version': '1.0',
		'widgets.type': 'smart_notification',
	}).stream();

	//
	// Loop through all Account documents
	// and ensure their smart notifications are organized

	let totalAccountsCounter = 0;
	let processedAccountsCounter = 0;

	for await (const accountItem of accountsStream) {
		//

		totalAccountsCounter++;

		//
		// Enforce correct type

		const accountData: Account = accountItem;

		Logs.divider();
		Logs.info(`[${totalAccountsCounter}] Processing Account ${accountData._id}...`);

		//
		// Check that this account has any smart_notification widget

		const smartNotificationWidgets = accountData.widgets?.filter(item => item.type === 'smart_notification');

		if (!smartNotificationWidgets?.length) {
			Logs.info(`Account ${accountData._id} does not have any smart_notification widgets. Skipping...`);
			continue;
		}

		//
		// Process this account's widgets and save changes

		const timer = new TIMETRACKER();

		try {
			const updatedWidgets = await getUpdatedWidgets(accountData.widgets);

			await accounts.updateById(accountData._id, { widgets: updatedWidgets });

			Logs.success(`Updated widgets for Account ${accountData._id} in ${timer.get()}.`);
		}
		catch (error) {
			Logs.error(`[${totalAccountsCounter}] Failed to update widgets for Account ${accountData._id}: ${error.message}`);
		}

		processedAccountsCounter++;

		//
	}

	Logs.terminate(`Organized ${processedAccountsCounter} out of ${totalAccountsCounter} accounts in ${globalTimer.get()}.`);

	//
}

/* * */

(async function init() {
	const runOnInterval = async () => {
		await organizeWidgets();
		setTimeout(runOnInterval, 300_000); // 5 minutes in milliseconds
	};
	runOnInterval();
})();
