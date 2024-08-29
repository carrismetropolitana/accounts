/* * */

import FastifyService from 'src/services/fastify.service';
import { FastifyInstance } from 'fastify';

import AccountsController from './accounts.controller';
import authMiddleware from '@/middleware/auth.middleware';

/* * */
const controller = new AccountsController();
const server: FastifyInstance = FastifyService.getInstance().server;
const namespace = '/v1/accounts';

/// Routes
// Accounts
server.register((instance, opts, next) => {

    instance.addHook('onRequest', async (request, reply) => await authMiddleware(request, reply));
    
    instance.get('/', controller.getAccounts);
    instance.post('/', controller.createAccount);
    instance.get('/:id', controller.getAccountById);
    instance.put('/:id', controller.updateAccount);
    instance.delete('/:id', controller.deleteAccount);
    
    // Accounts - Sync
    instance.post('/add-device', controller.addDevice);
    instance.post('/:id/add-device/:deviceId', controller.mergeDevice);
    instance.delete('/:id/remove-device/:deviceId', controller.deleteDevice);
    
    // Accounts - Favorites
    instance.post('/:id/favorite-lines/:line_id', controller.toggleFavoriteLine);
    instance.post('/:id/favorite-stops/:stop_id', controller.toggleFavoriteStop);

    next();
}, { prefix: namespace });
