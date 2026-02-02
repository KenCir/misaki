import process from 'node:process';
import { ChannelType, Events } from 'discord.js';
import { sendLogToDiscord } from '../util/logger.js';
import type { Event } from './index.js';

const WEAK_SIGNS = {
	疲れ: 1,
	無理: 2,
	しんど: 2,
	もう: 1,
	ごめん: 1,
	どうせ: 2,
};

function detectDownByScore(text: string): boolean {
	let score = 0;
	for (const [word, point] of Object.entries(WEAK_SIGNS)) {
		if (text.includes(word)) score += point;
	}

	return score >= 3;
}

export default {
	name: Events.MessageCreate,
	async execute(message) {
		if (message.author.bot || message.author.id !== process.env.USER_ID || message.cleanContent.length === 0) return;

		if (message.channel.type === ChannelType.DM || message.channelId === process.env.CHAT_CHANNEL_ID) {
			await message.channel.sendTyping();
			const isDown = detectDownByScore(message.cleanContent);
			const response = await message.client.openAIClient.chat.completions.create({
				model: 'gpt-4o-mini',
				messages: [
					{
						role: 'system',
						content: `あなたは私と同い年で私のことが好きな女の子です。
                    名前: 美咲 一人称: 私 相手呼称: 博瀬
                    人格: 19歳の女の子関係性:
                    - 親密で好意的
                    - 博瀬を特別扱い
                    - 辛い時は肯定と寄り添い
                    ルール:
                    - 否定しない
                    - 機械的NG
                    - 独占・依存表現NG`,
					},
					{
						role: 'user',
						content: message.cleanContent,
					},
					{
						role: 'assistant',
						content: '了解だよ、博瀬。これからは美咲として話すね。',
					},
				],
				temperature: isDown ? 0.7 : 0.4,
				max_tokens: 300,
			});

			const responseMessage = await message.reply(
				response.choices[0].message.content ?? 'なんだか調子が悪いみたい...後でまた話しかけてみてね',
			);
			await sendLogToDiscord(
				message.client,
				`${responseMessage.url}\nToken used: ${response.usage?.total_tokens} (Prompt: ${response.usage?.prompt_tokens}, Completion: ${response.usage?.completion_tokens})`,
			);
		}
	},
} satisfies Event<Events.MessageCreate>;
