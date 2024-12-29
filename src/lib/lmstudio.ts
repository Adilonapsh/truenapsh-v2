import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { createGoogleGenerativeAI } from '@ai-sdk/google';


export const lmstudio = createOpenAICompatible({
    name: 'lmstudio',
    baseURL: 'http://192.168.18.183:1234/v1',
});

export const google = createGoogleGenerativeAI({
    apiKey: process.env.NEXT_PUBLIC_GOOGLE_GEMINI_API_KEY
})

