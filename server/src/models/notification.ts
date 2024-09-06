import { Document, Schema } from 'mongoose';

export interface INotification {
    pattern_id: string
    stop_id: string
    distance: number
    distance_unit: 'meters' | 'min'
    start_time: number
    end_time: number
    week_days: string[]
}
export interface ISendNotificationDto extends INotification {
    user_id: string
    id: string
}

export interface INotificationDocument extends INotification, Document {}

export const NotificationSchema: Schema = new Schema<INotificationDocument>({
    pattern_id: { required: true, type: String },
    stop_id: { required: true, type: String },
    distance: { required: true, type: Number },
    distance_unit: { required: true, type: String, enum: ['meters', 'min'] },
    start_time: { required: true, type: Number, validate: (value: number) => {
        if (value < 0 || value > 86400) {
            throw new Error('Start time must be between 0 and 86400');
        }

        return true;
    } },
    end_time: { required: true, type: Number, validate: (value: number) => {
        if (value < 0 || value > 86400) {
            throw new Error('End time must be between 0 and 86400');
        }

        return true;
    } },
    week_days: { required: true, type: [String], validate: (week_days: string[]) => {
        if (week_days.length === 0) {
            throw new Error('At least one week day is required');
        }

        week_days.forEach((week_day) => {
            if (!['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].includes(week_day)) {
                throw new Error('Invalid week day');
            }
        });

        return true;
    } },
}, {timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }});

NotificationSchema.pre('validate', function (next) {
    if(this.end_time < this.start_time) {
        throw new Error('End time must be greater than start time');
    }

    next()
});