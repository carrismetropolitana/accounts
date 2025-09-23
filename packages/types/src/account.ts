/* * */

import { DeviceSchema } from '@/device.js';
import { FavoritesSchema } from '@/favorites.js';
import { NotificationsSchema } from '@/notifications.js';
import { PersonaSchema } from '@/persona.js';
import { PreferencesSchema } from '@/preferences.js';
import { ProfileSchema } from '@/profile.js';
import { WidgetSchema } from '@/widgets.js';
import { DocumentSchema } from '@tmlmobilidade/types';
import { z } from 'zod';

/* * */

export const ACCOUNT_ROLE_VALUES = ['owner', 'admin', 'user'] as const;

export const AccountRoleSchema = z.enum(ACCOUNT_ROLE_VALUES);

export type AccountRole = z.infer<typeof AccountRoleSchema>;

/* * */

export const AccountSchema = DocumentSchema.extend({
	devices: z.array(DeviceSchema).default([]),
	favorites: FavoritesSchema.default({}),
	notifications: NotificationsSchema.default({}),
	persona: PersonaSchema.default({}),
	preferences: PreferencesSchema.default({}),
	profile: ProfileSchema.default({}),
	role: AccountRoleSchema.default('user'),
	widgets: z.array(WidgetSchema).default([]),
});

export type Account = z.infer<typeof AccountSchema>;
