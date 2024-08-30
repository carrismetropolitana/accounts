import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

// Import your schema and model
import { INotification, NotificationSchema } from '@/models/notification';

// Create a model using the schema
const NotificationModel = mongoose.model<INotification>('Notification', NotificationSchema);

describe('Notification Schema', () => {
    let mongoServer: MongoMemoryServer;
    let conn: mongoose.Connection;

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();
        await mongoose.connect(uri);
        conn = mongoose.connection;
    });

    afterAll(async () => {
        await conn.dropDatabase();
        await conn.close();
        await mongoServer.stop();
    });

    beforeEach(async () => {
        await NotificationModel.deleteMany({});
    });

    it('should create a notification with valid data', async () => {
        const validData = {
            line_id: 'line1',
            stop_id: 'stop1',
            distance: 100,
            distance_unit: 'km',
            start_time: 3600,
            end_time: 7200,
            week_days: ['monday', 'tuesday']
        };

        const notification = new NotificationModel(validData);
        await expect(notification.save()).resolves.toBeInstanceOf(NotificationModel);
    });

    it('should fail if end_time is less than start_time', async () => {
        const invalidData = {
            line_id: 'line1',
            stop_id: 'stop1',
            distance: 100,
            distance_unit: 'km',
            start_time: 3600,
            end_time: 1800,  // Invalid
            week_days: ['monday', 'tuesday']
        };

        const notification = new NotificationModel(invalidData);
        await expect(notification.save()).rejects.toThrow('End time must be greater than start time');
    });

    it('should fail if week_days are invalid', async () => {
        const invalidData = {
            line_id: 'line1',
            stop_id: 'stop1',
            distance: 100,
            distance_unit: 'km',
            start_time: 3600,
            end_time: 7200,
            week_days: ['mon', 'tue']  // Invalid
        };

        const notification = new NotificationModel(invalidData);
        await expect(notification.save()).rejects.toThrow('Invalid week day');
    });

    it('should fail if start_time > end_time', async () => { it
        const invalidData = {
            line_id: 'line1',
            stop_id: 'stop1',
            distance: 100,
            distance_unit: 'km',
            start_time: 7201,  // Invalid start time > end time
            end_time: 7200,
            week_days: ['monday', 'tuesday']
        };

        const notification = new NotificationModel(invalidData);
        await expect(notification.save()).rejects.toThrow('End time must be greater than start time');
    });

    it('should fail if start_time is out of bounds', async () => { it
        const invalidData = {
            line_id: 'line1',
            stop_id: 'stop1',
            distance: 100,
            distance_unit: 'km',
            start_time: -1,  // Invalid start time > end time
            end_time: 86400,
            week_days: ['monday', 'tuesday']
        };

        const notification = new NotificationModel(invalidData);
        await expect(notification.save()).rejects.toThrow('Start time must be between 0 and 86400');
    });

    it('should fail if end_time is out of bounds', async () => { it
        const invalidData = {
            line_id: 'line1',
            stop_id: 'stop1',
            distance: 100,
            distance_unit: 'km',
            start_time: 0,
            end_time: 86401,  // Invalid end time > end time
            week_days: ['monday', 'tuesday']
        };

        const notification = new NotificationModel(invalidData);
        await expect(notification.save()).rejects.toThrow('End time must be between 0 and 86400');
    });

    it('should fail if no week_days are provided', async () => {
        const invalidData = {
            line_id: 'line1',
            stop_id: 'stop1',
            distance: 100,
            distance_unit: 'km',
            start_time: 3600,
            end_time: 7200,
            week_days: []  // Invalid
        };

        const notification = new NotificationModel(invalidData);
        await expect(notification.save()).rejects.toThrow('At least one week day is required');
    });
});
