import { model } from 'mongoose';

import { AccountSchema, IAccount } from './account';
import { DeviceSchema, IDevice } from './device';
import { ILine, LineSchema } from './line';
import { IStop, StopSchema } from './stop';

export const StopModel = model<IStop>('Stop', StopSchema);
export const LineModel = model<ILine>('Line', LineSchema);
export const DeviceModel = model<IDevice>('Device', DeviceSchema);
export const AccountModel = model<IAccount>('Account', AccountSchema);
