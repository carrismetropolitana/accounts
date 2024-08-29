import { Document, Schema } from 'mongoose';

import { DeviceSchema, IDevice } from './device';

export interface IAccount extends Document {
	devices: IDevice[]
	email: string
	favorite_lines?: string[]
	favorite_stops?: string[]
	first_name?: string
	last_name?: string
	avatar?: string
	role?: 'owner' | 'admin' | 'user'
}

export const AccountSchema: Schema = new Schema<IAccount>({
	devices: { required: true, type: [DeviceSchema], validate: (devices: IDevice[]) => {
		if (devices.length === 0) {
			throw new Error('At least one device is required');
		}

		return true;
	} },
	email: { type: String },
	favorite_lines: { default: [], type: [String] },
	favorite_stops: { default: [], type: [String] },
	first_name: { type: String },
	last_name: { type: String },
	avatar: { type: String },
	role: { type: String, enum: ['owner', 'admin', 'user'], default: 'user' },
});
