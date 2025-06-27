/* * */

import authorizationMiddleware from '@/middleware/authorization.middleware.js';
import FastifyService from '@/services/fastify.service.js';
import FirebaseService from '@/services/firebase.service.js';
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

import { AccountsController } from './accounts.controller.js';

/* * */

const server: FastifyInstance = FastifyService.getInstance().server;
const namespace = '/accounts';

/* * */

server.register(
	(instance, opts, next) => {
		// GET /accounts
		instance.get(
			'/all',
			{
				preHandler: authorizationMiddleware,
			},
			AccountsController.getAll,
		);

		// GET /accounts/
		instance.get(
			'/',
			{
				preHandler: authorizationMiddleware,
			},
			AccountsController.getByUserId,
		);

		// GET /persona
		instance.get(
			'/persona',
			{
				// preHandler: authorizationMiddleware,
			},
			AccountsController.getPersona,
		);

		// GET /persona/:id
		instance.get(
			'/persona/:id',
			{
				// preHandler: authorizationMiddleware,
			},
			AccountsController.getPersonaImageById,
		);

		// POST /accounts
		instance.post(
			'/',
			AccountsController.create,
		);

		// PUT /accounts/
		instance.put(
			'/',
			{
				preHandler: authorizationMiddleware,
			},
			AccountsController.update,
		);

		// POST /accounts//smart-notification
		instance.post(
			'/smart-notifications',
			{
				preHandler: authorizationMiddleware,
			},
			AccountsController.createSmartNotification,
		);

		// DELETE /accounts/
		instance.delete(
			'/',
			{
				preHandler: authorizationMiddleware,
			},
			AccountsController.delete,
		);

		// GET /accounts/send-notification
		instance.get(
			'/send-notification',
			async (
				request: FastifyRequest,
				reply: FastifyReply,
			) => {
				const { body, title, topic } = request.query as { body: string, title: string, topic: string };

				// Check missing fields
				const requiredFields = ['body', 'title', 'topic'];
				const missingFields = requiredFields.filter(field => !request.query[field]);

				if (missingFields.length > 0) {
					return reply.status(400).send({
						error: `Missing required fields: ${missingFields.join(', ')}`,
					});
				}

				const response = await FirebaseService.getInstance().sendNotification(topic, {
					body,
					title,
				});

				return reply.status(200).send(response);
			},
		);

		next();
	},
	{ prefix: namespace },
);
