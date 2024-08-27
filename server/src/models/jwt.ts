export interface IJwtSync {
    iat: number
    exp: number
    device_id: string
    device_id_2: string
}

export interface IJwt {
    iat: number
    exp: number
    device_id: string
}