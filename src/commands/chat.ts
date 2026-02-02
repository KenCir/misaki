import { ApplicationCommandOptionType } from 'discord.js';
import type { Command } from './index.js';

export default {
	data: {
		name: 'chat',
		description: 'OpenAIとチャットする',
		options: [
			{
				name: 'message',
				type: ApplicationCommandOptionType.String,
				description: 'Chat message to send to OpenAI',
				required: true,
			},
		],
	},
	async execute(interaction) {
		if (!interaction.isChatInputCommand()) {
			await interaction.reply('対応していない操作');
			return;
		}

		await interaction.deferReply();

		const userMessage = interaction.options.getString('message', true);
		const response = await interaction.client.openAIClient.chat.completions.create({
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
					content: userMessage,
				},
				{
					role: 'assistant',
					content: '了解だよ、博瀬。これからは美咲として話すね。',
				},
			],
			temperature: 1,
			max_tokens: 300,
		});

		await interaction.followUp(
			`${response.choices[0].message.content}\n\n使用したトークン数: ${response.usage?.total_tokens}\n内入力トークン数: ${response.usage?.prompt_tokens}\n内出力トークン数: ${response.usage?.completion_tokens}`,
		);
	},
} satisfies Command;
