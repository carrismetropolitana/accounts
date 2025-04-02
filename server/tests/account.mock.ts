import { Account, AccountDevice } from '@/interfaces/account.type.js';
import { getUnixTimestamp } from '@tmlmobilidade/utils';

export const mockDevice: AccountDevice = {
    device_id: '123',
    name: 'My Phone',
    type: 'android'
};

export const mockAccount: Account = {
    _id: '123',
    created_at: getUnixTimestamp(),
    updated_at: getUnixTimestamp(),
    devices: [mockDevice],
    email: 'test@example.com',
    favorites: {
        lines: ['line1'],
        stops: ['stop1']
    },
    profile: {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        date_of_birth: getUnixTimestamp(),
        gender: 'male',
        work_setting: 'hybrid',
        utilization_type: 'frequent',
        activity: 'working'
    },
    email_verified: getUnixTimestamp(),
    notification_preferences: {
        network: true,
        events: true,
        agency: true
    },
    role: 'user',
};

export const mockCreateAccountWrongTypes = {
    _id: '123',
    created_at: new Date(),
    updated_at: new Date(),
    devices: [{
        device_id: '123',
        type: 'android'
    }],
    email: 'test@example.com',
    favorites: {
        routes: [],
        stops: []
    }
};

export const mockCreateAccountNoDevices = {
    devices: [],
    email: 'test@example.com',
};

export const mockCreateAccountMinimum = {
    devices: [{
        device_id: '123',
        type: 'android'
    }],
};
