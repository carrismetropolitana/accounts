/* * */

import FastifyService from 'src/services/fastify.service';
import { FastifyInstance } from 'fastify';

import AccountsController from './accounts.controller';

/* * */
const controller = new AccountsController();
const server: FastifyInstance = FastifyService.getInstance().server;
const namespace = '/v1/accounts';

/// Routes
// Accounts
server.get(namespace, controller.getAccounts);
server.post(namespace, controller.createAccount);
server.get(namespace + '/:id', controller.getAccountById);
server.put(namespace + '/:id', controller.updateAccount);
server.delete(namespace + '/:id', controller.deleteAccount);

// Accounts - Sync
server.post(namespace + '/add-device', controller.addDevice);
server.post(namespace + '/:id/add-device/:deviceId', controller.mergeDevice);
server.delete(namespace + '/:id/remove-device/:deviceId', controller.deleteDevice);

// Accounts - Favorites
server.post(namespace + '/:id/favorite-lines/:line_id', controller.toggleFavoriteLine);
server.post(namespace + '/:id/favorite-stops/:stop_id', controller.toggleFavoriteStop);
