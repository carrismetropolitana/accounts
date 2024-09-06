import HttpException from "@/common/http-exception";
import { ISendNotificationDto } from "@/models/notification";

export default class SmartNotificationsService {
    private static _instance: SmartNotificationsService;
    private readonly baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    public static getInstance(baseUrl?: string) {
        if (!SmartNotificationsService._instance) {
            if (!baseUrl) {
                throw new Error('Base URL is required');
            }

            SmartNotificationsService._instance = new SmartNotificationsService(baseUrl);
        }

        return SmartNotificationsService._instance;
    }

    async upsertNotification(notification: ISendNotificationDto) : Promise<any> {
        const response = await fetch(`${this.baseUrl}/notifications`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(notification),
        });

        const json = await response.json();

        if (!response.ok) {
            console.log(json.errors);
            throw new HttpException(response.status, json["message"]);
        }

        return json;
    }

    async deleteNotification(id: string) : Promise<any> {
        const response = await fetch(`${this.baseUrl}/notifications/${id}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new HttpException(response.status, response.statusText);
        }
    }
}