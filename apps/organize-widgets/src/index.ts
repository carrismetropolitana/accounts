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
	const accountsStream = accountsCollection.find({ _version: '1.0' }).stream();

	//
	// Loop through all Account documents
	// and ensure their smart notifications are organized

	for await (const accountItem of accountsStream) {
		//

		//
		// Enforce type

		const accountData: Account = accountItem;

		//
		// Skip if account is not available
		// or does not have the correct version

		if (!accountData) {
			Logs.error(`Account ${accountData._id} not found. Skipping.`);
			return;
		}

		if (accountData._version !== '1.0') {
			Logs.error(`Account ${accountData._id} has unsupported version ${accountData._version}. Skipping.`);
			return;
		}

		//
		// Check that this account has any smart_notification widget

		const smartNotificationWidgets = accountData.widgets?.filter(item => item.type === 'smart_notification');

		if (!smartNotificationWidgets?.length) {
			Logs.error(`Account ${accountData._id} does not have any smart_notification widgets. Skipping.`);
			return;
		}

		//
		// Process this account's widgets and save changes

		const timer = new TIMETRACKER();

		const updatedWidgets = await getUpdatedWidgets(accountData.widgets);

		await accounts.updateById(accountData._id, { widgets: updatedWidgets });

		Logs.terminate(`Updated widgets for Account ${accountData._id} in ${timer.get()}`);

		//
	}

	Logs.terminate(`Organization completed in ${globalTimer.get()}`);

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
