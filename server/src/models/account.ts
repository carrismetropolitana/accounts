import { Document, Schema } from 'mongoose';

import { DeviceSchema, IDevice } from './device';
import { INotification, NotificationSchema } from './notification';

export interface IAccount extends Document {
	devices: IDevice[]
	email: string
	favorite_lines?: string[]
	favorite_stops?: string[]
	first_name?: string
	last_name?: string
	avatar?: string
	role?: 'owner' | 'admin' | 'user'
	date_of_birth?: Date,
	work_municipality?: string,
	home_municipality?: string,
	activity?: 'student' | 'university' | 'working' | 'retired' | 'other',
	gender?: 'male' | 'female',
	phone?: string,
	notification_preferences?: {
		network: boolean,
		events: boolean,
		company: boolean,
	},
	notifications?: INotification[],
	work_setting: "hybrid" | "remote" | "office",
	utilization_type: "frequent" | "occasional",
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
	date_of_birth: { type: Date },
	work_municipality: { type: String },
	home_municipality: { type: String },
	activity: { type: String },
	gender: { type: String },
	phone: { type: String },
	notification_preferences: { type: Object, default: {} },
	work_setting: { type: String },
	utilization_type: { type: String },
	notifications: { type: [NotificationSchema] },
}, {timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }});
