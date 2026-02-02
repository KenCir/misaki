import { Client } from 'discord.js';
import type OpenAI from 'openai';

declare module 'discord.js' {
	// ここはinterfaceで定義する必要がある
	// eslint-disable-next-line @typescript-eslint/consistent-type-definitions
	interface Client {
		openAIClient: OpenAI;
	}
}
