/* * */

import { z } from 'zod';

/* * */

const DEVICE_TYPE_VALUES = ['android', 'ios', 'web'] as const;

export const DeviceTypeSchema = z.enum(DEVICE_TYPE_VALUES);

export type DeviceType = z.infer<typeof DeviceTypeSchema>;

/* * */

export const DeviceSchema = z.object({
	app_version: z.string().nullable().default(null),
	device_id: z.string(),
	name: z.string().nullable().default(null),
	push_token: z.string().nullable().default(null),
	type: DeviceTypeSchema.nullable().default(null),
});

export type Device = z.infer<typeof DeviceSchema>;
