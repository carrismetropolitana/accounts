import { FastifyRequest, FastifyReply } from "fastify";

// declare module 'fastify' {
//     export interface FastifyRequest {
//       fastifyUser?: IFastifyUser;
//     }
//   }

export default async function authorizationMiddleware(request: FastifyRequest, reply: FastifyReply) {
	// const token = request.headers['authorization']?.split(' ')[1] || undefined;

    // const decodedToken = await verifyJWT<IJwt | IJwtSync>(token);
    // if (!decodedToken) {
    //     throw new HttpException(HttpStatus.UNAUTHORIZED, 'Invalid authorization token');
    // }

    // const accountService = new AccountsService();
    // const account = await accountService.getAccountById(decodedToken.device_id);
    // if (account) {
    //     request.fastifyUser = {
    //         device_id: decodedToken.device_id,
    //         role: account.role,
    //     };
    // }
    return;
}