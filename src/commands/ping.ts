import process from 'node:process';
import type { Command } from './index.js';

function formatBytes(bytes: number): string {
	if (bytes < 1_024) return `${bytes}B`;
	const kb = bytes / 1_024;
	if (kb < 1_024) return `${kb.toFixed(2)}KB`;
	const mb = kb / 1_024;
	if (mb < 1_024) return `${mb.toFixed(2)}MB`;
	const gb = mb / 1_024;
	return `${gb.toFixed(2)}GB`;
}

export default {
	data: {
		name: 'ping',
		description: 'Ping!',
	},
	async execute(interaction) {
		await interaction.reply(
			`Pong!\nLatency: ${interaction.client.ws.ping}ms\nMemory Usage: ${formatBytes(process.memoryUsage().rss)}`,
		);
	},
} satisfies Command;
