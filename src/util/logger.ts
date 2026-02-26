import process from 'node:process';
import { ChannelType } from 'discord.js';
import type { Client } from 'discord.js';
import pino from 'pino';

let transport;
if (process.env.NODE_ENV === 'development') {
	transport = pino.transport({
		targets: [
			{
				target: 'pino-pretty',
				options: {
					colorize: true,
					translateTime: 'SYS:yyyy-mm-dd HH:MM:ss o', // JSTにする
					ignore: 'pid,hostname',
				},
				level: 'debug',
			},
		],
	});
}

export const logger = pino(
	{
		name: process.env.LOGGER_NAME,
		level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
	},
	transport,
);

/**
 * ログをDiscordに送信します
 *
 * @param client - Discord Client
 * @param message - 送信するログメッセージ
 */
export async function sendLogToDiscord(client: Client, message: string): Promise<void> {
	try {
		const forumChannel = client.channels.cache.get(process.env.LOG_CHANNEL_ID!);
		if (forumChannel?.type !== ChannelType.GuildForum) return;
		const thread = forumChannel.threads.cache.get(process.env.LOG_THREAD_ID!);
		if (!thread) return;
		await thread.send(message);
	} catch (error) {
		logger.error(error, 'Error sending log to Discord');
	}
}

/**
 * エラーログをDiscordに送信します
 *
 * @param client - Discord Client
 * @param message - 送信するログメッセージ
 */
export async function sendErrorLogToDiscord(client: Client, message: string): Promise<void> {
	try {
		const forumChannel = client.channels.cache.get(process.env.LOG_CHANNEL_ID!);
		if (forumChannel?.type !== ChannelType.GuildForum) return;
		const thread = forumChannel.threads.cache.get(process.env.ERRORLOG_THREAD_ID!);
		if (!thread) return;
		await thread.send(message);
	} catch (error) {
		logger.error(error, 'Error sending error log to Discord');
	}
}
