import { IAccount } from "./account";

export interface IFastifyUser {
	device_id: string;
	role: IAccount['role'];
}