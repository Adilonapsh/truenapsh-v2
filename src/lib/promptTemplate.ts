import { systemPrompt } from './systemPrompt';

export function createPrompt(messages: { role: string; content: string }[]) {
  const prompt = [
    { role: 'system', content: systemPrompt },
    ...messages
  ];

  return prompt.map(message => `${message.role}: ${message.content}`).join('\n\n');
}

