import { streamText } from 'ai';
import { google, lmstudio } from '@/lib/lmstudio';
import { createPrompt } from '@/lib/promptTemplate';

export const maxDuration = 30;

export async function POST(req: Request) {

    const allowedOrigins = ['https://truenapsh.my.id', 'https://maps.truenapsh.my.id', "https://trumap.web.id", "http://localhost:3000", "http://localhost:3001"];
    const origin = req.headers.get('origin');

    if (!origin || !allowedOrigins.includes(origin)) {
        return new Response(
            JSON.stringify({ error: 'Origin not allowed' }),
            {
                status: 403,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    }

    try {
        const { messages } = await req.json();
        const prompt = createPrompt(messages);

        const result = streamText({
            // model: lmstudio('TheBloke/CodeLlama-7B-Instruct-GGUF'),
            // model: google('gemini-2.0-flash-exp'),
            model: google('gemini-1.5-flash'),
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.8,
            // tools: [],
        });
        return result.toDataStreamResponse();
    } catch (error) {
        console.error('Error in chat API:', error);
        return new Response(JSON.stringify({ error: 'Terjadi kesalahan saat memproses permintaan' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}

