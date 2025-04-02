import { DocumentSchema, UnixTimestamp, validateUnixTimestamp } from '@tmlmobilidade/types';
import { getUnixTimestamp } from '@tmlmobilidade/utils';
import { z } from 'zod';

// ENUMS
const GENDER_VALUES = ['male', 'female'] as const;
const ROLE_VALUES = ['owner', 'admin', 'user'] as const;
const WORK_SETTING_VALUES = ['hybrid', 'remote', 'office'] as const;
const UTILIZATION_TYPE_VALUES = ['frequent', 'occasional'] as const;
const ACTIVITY_VALUES = ['student', 'university', 'working', 'retired', 'other'] as const;
const DEVICE_TYPE_VALUES = ['android', 'ios', 'web'] as const;
const WIDGET_TYPE_VALUES = ['lines', 'stops', 'smart_notifications'] as const;

// ENUM SCHEMAS
export const GenderSchema = z.enum(GENDER_VALUES);
export const RoleSchema = z.enum(ROLE_VALUES);
export const WorkSettingSchema = z.enum(WORK_SETTING_VALUES);
export const UtilizationTypeSchema = z.enum(UTILIZATION_TYPE_VALUES);
export const ActivitySchema = z.enum(ACTIVITY_VALUES);
export const DeviceTypeSchema = z.enum(DEVICE_TYPE_VALUES);
export const WidgetTypeSchema = z.enum(WIDGET_TYPE_VALUES);

// SCHEMA
export const PhoneSchema = z.string().regex(/^\+[1-9]\d{1,14}$/);

export const DeviceSchema = z.object({
    device_id: z.string(),
    name: z.string().nullish(),
    type: DeviceTypeSchema,
});

const WidgetLinesSchema = z.object({
    type: WidgetTypeSchema.pipe(z.literal('lines')),
    pattern_id: z.string(),
});

const WidgetStopsSchema = z.object({
    type: WidgetTypeSchema.pipe(z.literal('stops')),
    stop_id: z.string(),
    pattern_ids: z.array(z.string()),
});

// const WidgetSmartNotificationsSchema = z.object({
//     type: WidgetTypeSchema.pipe(z.literal('smart_notifications')),
//     notification_ids: z.array(z.string()),
// });

const WidgetSchema = z.object({
    data: z.union([WidgetLinesSchema, WidgetStopsSchema]),
    settings: z.object({
        label: z.string().nullish(),
        is_open: z.boolean().default(true),
        display_order: z.number().nullish(),
    }),
});

const FavoritesSchema = z.object({
    lines: z.array(z.string()),
    stops: z.array(z.string()),
});

const ProfileSchema = z.object({
    first_name: z.string().nullish(),
    last_name: z.string().nullish(),
    email: z.string().email().nullish(),
    phone: PhoneSchema.nullish(),
    date_of_birth: z.number().transform(validateUnixTimestamp).brand('UnixTimestamp').nullish(),
    gender: GenderSchema.nullish(),
    work_setting: WorkSettingSchema.nullish(),
    utilization_type: UtilizationTypeSchema.nullish(),
    activity: ActivitySchema.nullish(),
}).strict();

export const AccountSchema = DocumentSchema.extend({
    devices: z.array(DeviceSchema).min(1),
    widgets: z.array(WidgetSchema).nullish(),
    favorites: FavoritesSchema.nullish(),
    profile: ProfileSchema.nullish(),
	email: z.string().email().nullish(),
    email_verified: z.number().transform(validateUnixTimestamp).brand('UnixTimestamp').nullish(),
    notification_preferences: z.object({
        network: z.boolean().default(true),
        events: z.boolean().default(true),
        agency: z.boolean().default(true),
    }).nullish(),
    role: RoleSchema.default('user'),
}).strict();

export const CreateAccountSchema = AccountSchema
	.omit({ _id: true, created_at: true, updated_at: true, role: true, notification_preferences: true });

export const UpdateAccountSchema = AccountSchema
	.omit({ _id: true, created_at: true, updated_at: true, role: true })
	.partial();

// TYPES
export type AccountGender = z.infer<typeof GenderSchema>;
export type AccountRole = z.infer<typeof RoleSchema>;
export type AccountWorkSetting = z.infer<typeof WorkSettingSchema>;
export type AccountUtilizationType = z.infer<typeof UtilizationTypeSchema>;
export type AccountActivity = z.infer<typeof ActivitySchema>;
export type AccountDeviceType = z.infer<typeof DeviceTypeSchema>;
export type AccountWidgetType = z.infer<typeof WidgetTypeSchema>;
export type AccountFavorites = z.infer<typeof FavoritesSchema>;
export type AccountWidget = z.infer<typeof WidgetSchema>;
export type AccountDevice = Omit<z.infer<typeof DeviceSchema>, 'type'> & { type: AccountDeviceType };

export type AccountProfile = Omit<z.infer<typeof ProfileSchema>,
    | 'gender'
    | 'work_setting'
    | 'utilization_type'
    | 'activity'
    | 'date_of_birth'
> & {
    gender?: AccountGender,
    work_setting?: AccountWorkSetting,
    utilization_type?: AccountUtilizationType,
    activity?: AccountActivity,
    date_of_birth?:  null | undefined | UnixTimestamp,
};

export type Account = Omit<
    z.infer<typeof AccountSchema>,
    | 'created_at'
    | 'updated_at'
    | 'email'
    | 'email_verified'
    | 'widgets'
    | 'favorites'
    | 'date_of_birth'
    | 'profile'
> & {
    devices: AccountDevice[],
    created_at: UnixTimestamp,
    updated_at: UnixTimestamp,
    email?: string | null | undefined,
    email_verified?:  null | undefined | UnixTimestamp,
    widgets?: AccountWidget[],
    favorites?: AccountFavorites,
    profile?: AccountProfile,
};

export type CreateAccountDto = Omit<
    z.infer<typeof CreateAccountSchema>,
    | 'email_verified'
    | 'favorites'
    | 'widgets'
    | 'date_of_birth'
    | 'profile'
> & {
    email_verified?:  null | undefined | UnixTimestamp,
    date_of_birth?:  null | undefined | UnixTimestamp,
    favorites?: AccountFavorites,
    widgets?: AccountWidget[],
    profile?: AccountProfile,
};

export type UpdateAccountDto = Partial<Omit<CreateAccountDto, 'created_by'>>;