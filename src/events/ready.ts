import { Events } from 'discord.js';
import { logger } from '../util/logger.js';
import type { Event } from './index.js';

export default {
	name: Events.ClientReady,
	once: true,
	async execute(client) {
		logger.info(`Ready! Logged in as ${client.user.tag}`);
	},
} satisfies Event<Events.ClientReady>;
