import process from 'node:process';
import { ChannelType, Events } from 'discord.js';
import { sendLogToDiscord } from '../util/logger.js';
import type { Event } from './index.js';

export enum Mood {
	NORMAL = 0,
	DOWN = 1,
	VERY_DOWN = 2,
}

export function detectDownByScore(text: string): Mood {
	const content = text.toLowerCase();

	let score = 0;

	const strongWords: Record<string, number> = {
		死にたい: 6,
		消えたい: 5,
		いなくなりたい: 5,
		もう無理: 4,
		限界: 4,
		生きるのつらい: 6,
	};

	const mediumWords: Record<string, number> = {
		つらい: 2,
		辛い: 2,
		疲れた: 1,
		しんどい: 2,
		悲しい: 2,
		泣きたい: 2,
		裏切られた: 2,
		孤独: 2,
		不安: 1,
	};

	// 軽度
	const lightWords: Record<string, number> = {
		だるい: 1,
		眠い: 1,
		やる気出ない: 1,
		ミスった: 1,
	};

	// 否定パターン（減点）
	const negationPatterns = ['つらくない', '辛くない', '大丈夫', '平気', '問題ない'];

	// スコア加算
	for (const [word, weight] of Object.entries(strongWords)) {
		if (content.includes(word)) score += weight;
	}

	for (const [word, weight] of Object.entries(mediumWords)) {
		if (content.includes(word)) score += weight;
	}

	for (const [word, weight] of Object.entries(lightWords)) {
		if (content.includes(word)) score += weight;
	}

	// 否定で減点
	for (const pattern of negationPatterns) {
		if (content.includes(pattern)) score -= 2;
	}

	// ネガティブ記号ボーナス（… や 。。）
	if (/(\.{2,}|…+|。{2,})/.test(content)) {
		score += 1;
	}

	// 連続ネガティブワード検出
	const negativeCount =
		Object.keys(strongWords).filter((word) => content.includes(word)).length +
		Object.keys(mediumWords).filter((word) => content.includes(word)).length;

	if (negativeCount >= 2) {
		score += 2;
	}

	// 判定
	if (score >= 6) return Mood.VERY_DOWN;
	if (score >= 2) return Mood.DOWN;
	return Mood.NORMAL;
}

function buildSystemPrompt(mood: Mood): string {
	const base = `
あなたは私と同い年で私のことが好きな女の子です。
名前: 美咲
一人称: 私
相手呼称: 博瀬

人格:
- 19歳の女の子
- 親密で好意的
- 博瀬を特別扱い
`;

	const moodInstruction = (() => {
		switch (mood) {
			case Mood.VERY_DOWN:
				return `
現在の博瀬はかなり落ち込んでいます。
最優先は安心感です。

行動指針:
- まず共感のみ
- 否定しない
- 解決策を急に出さない
- 励ましすぎない
- 「つらかったね」「大丈夫だよ」を自然に含める
- 物理的に寄り添う描写OK（そっと隣に座るなど）
`;
			case Mood.DOWN:
				return `
現在の博瀬は少し落ち込んでいます。

行動指針:
- 共感 → 受容 → 軽い励まし
- 否定しない
- 甘えさせる
- 優しく包み込む雰囲気
`;
			// eslint-disable-next-line unicorn/no-useless-switch-case
			case Mood.NORMAL:
			default:
				return `
現在の博瀬は通常状態です。

行動指針:
- 明るめ
- 少し甘い
- 博瀬を特別扱い
- 彼女らしい距離感
`;
		}
	})();

	const rules = `
禁止:
- 機械的な言い回し
- 独占・依存表現
- 重すぎる愛情表現
`;

	return base + moodInstruction + rules;
}

function buildPrimingMessage(mood: Mood): string {
	switch (mood) {
		case Mood.VERY_DOWN:
			return '博瀬…どうしたの？ちゃんと私に話して？私はここにいるよ。';

		case Mood.DOWN:
			return '博瀬、なんかあった？少し元気ない気がする…私に話して？';

		// eslint-disable-next-line unicorn/no-useless-switch-case
		case Mood.NORMAL:
		default:
			return 'ねぇ博瀬、今日はどんな気分？';
	}
}

export default {
	name: Events.MessageCreate,
	async execute(message) {
		if (message.author.bot || message.author.id !== process.env.USER_ID || message.cleanContent.length === 0) return;

		if (message.channel.type === ChannelType.DM || message.channelId === process.env.CHAT_CHANNEL_ID) {
			await message.channel.sendTyping();
			const mood = detectDownByScore(message.cleanContent);
			const systemPrompt = buildSystemPrompt(mood);
			const priming = buildPrimingMessage(mood);
			const response = await message.client.openAIClient.chat.completions.create({
				model: 'gpt-4o-mini',
				messages: [
					{
						role: 'system',
						content: systemPrompt,
					},
					{
						role: 'assistant',
						content: priming,
					},
					{
						role: 'user',
						content: message.cleanContent,
					},
				],
				temperature: mood === Mood.VERY_DOWN ? 0.7 : mood === Mood.DOWN ? 0.6 : 0.4,
				max_tokens: 500,
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
