/* * */

import { accounts } from '@carrismetropolitana/accounts-interfaces';
import { type Account } from '@carrismetropolitana/accounts-types';
import TIMETRACKER from '@helperkits/timer';
import { Dates, Logs } from '@tmlmobilidade/utils';

/**
 * Organizes Accounts.
 * This function will:
 * - Stream all accounts
 * - For each account, check if it has been updated in the last 6 months
 *   - If not, delete the account
 * - For each device in the account, check if it has a push token
 *   - If it does, find other accounts with the same push token
 *   - If found, remove the push token from those accounts
 */
async function organizeAccounts() {
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

		const accountData: Account = accountItem;

		//
		// Accounts older than 6 months should be deleted
		// to avoid unnecessary processing.

		const sixMonthsAgo = Dates
			.now('Europe/Lisbon')
			.minus({ months: 6 })
			.unix_timestamp;

		if (accountData.updated_at < sixMonthsAgo) {
			// await accounts.deleteById(accountData._id);
			Logs.info(`Account ${accountData._id} deleted due to inactivity (last updated_at ${Dates.fromUnixTimestamp(accountData.updated_at).toFormat('DD/MM/YYYY HH:mm')}).`);
			continue;
		}

		//
		// Ensure there is only one Expo notification token per account in the database.
		// Keep only the device with the most recent updated_at timestamp.

		for (const deviceData of accountData.devices) {
			//

			//
			// Skip if this device has no push token

			if (!deviceData.push_token) continue;

			//
			// Find other accounts with the same push token

			const otherAccountsWithTheSamePushToken = await accounts.findMany({
				'_id': { $ne: accountData._id }, // Exclude the current account
				'devices.push_token': deviceData.push_token, // Match the push token
			});

			//
			// If more than one account has the same push token,
			// remove it from the device object as it is a duplicate.

			for (const otherAccount of otherAccountsWithTheSamePushToken) {
				// If the token is the same, remove it from the device object.
				otherAccount.devices = otherAccount.devices.map((item) => {
					if (item.push_token === deviceData.push_token) return { ...item, push_token: null };
					return item;
				});
				// Update the account in the database.
				await accounts.updateById(otherAccount._id, otherAccount);
				Logs.info(`Removed duplicate push token from account ${otherAccount._id}.`);
			}
		}

		//
		// Log the operation success

		Logs.success(`Account ${accountData._id} updated successfully.`);

		//
	}

	Logs.terminate(`Organization completed in ${globalTimer.get()}`);

	//
}

/* * */

(async function init() {
	const runOnInterval = async () => {
		await organizeAccounts();
		setTimeout(runOnInterval, 300_000); // 5 minutes in milliseconds
	};
	runOnInterval();
})();
