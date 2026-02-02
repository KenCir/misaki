import process from 'node:process';
import { Client, GatewayIntentBits } from 'discord.js';
import OpenAI from 'openai';
import { loadEvents } from './util/loaders.js';
import { logger, sendErrorLogToDiscord } from './util/logger.js';

// Initialize the client
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.DirectMessages,
		GatewayIntentBits.GuildMembers,
	],
});
client.openAIClient = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY!,
});

// Load the events and commands
const events = await loadEvents(new URL('events/', import.meta.url));

// Register the event handlers
for (const event of events) {
	client[event.once ? 'once' : 'on'](event.name, async (...args) => {
		try {
			await event.execute(...args);
		} catch (error) {
			console.error(`Error executing event ${String(event.name)}:`, error);
			await sendErrorLogToDiscord(
				client,
				`イベント \`${String(event.name)}\` で処理中にエラーが発生しました\n\n\`\`\`${error}\`\`\``,
			);
		}
	});

	logger.info(`Registered event handler for ${String(event.name)}.`);
}

process.on('unhandledRejection', async (reason, promise) => {
	logger.error(reason, 'Unhandled Rejection at:', promise);
	await sendErrorLogToDiscord(client, `処理されない例外が発生しました\n\n\`\`\`${reason}\`\`\``);
});

process.on('SIGINT', async (_) => {
	logger.info('Shutting down...');

	await client.destroy();
	// process.exit();
});

// Login to the client
void client.login(process.env.DISCORD_TOKEN);
