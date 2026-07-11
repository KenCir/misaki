import { Client } from 'discord.js';
import type OpenAI from 'openai';

declare module 'discord.js' {
	// ここはinterfaceで定義する必要がある
	interface Client {
		openAIClient: OpenAI;
	}
}
