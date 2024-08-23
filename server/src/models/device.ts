import { Document, Schema } from 'mongoose';

export interface IDevice extends Document {
	device_id: string
	name: string
	type: string
}

export const DeviceSchema: Schema = new Schema<IDevice>({
	device_id: { required: true, type: String },
	name: { type: String },
	type: { type: String },
});
