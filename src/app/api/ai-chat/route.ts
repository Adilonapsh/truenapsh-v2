import { streamText, tool } from "ai";
import { google, lmstudio, openrouter } from "@/lib/lmstudio";
import { createPrompt } from "@/lib/promptTemplate";

import { systemPrompt } from "@/lib/systemPrompt";
import callTools from "@/tools/ai-tools/mcp-tools";
import { getToken } from "next-auth/jwt";
import { decrypt } from "@/lib/crypt";

export const maxDuration = 30;

export async function POST(req: Request) {
    const allowedOrigins = [
        "https://truenapsh.my.id",
        "https://maps.truenapsh.my.id",
        "https://trumap.web.id",
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
    ];
    const origin = req.headers.get("origin");

    if (!origin || !allowedOrigins.includes(origin)) {
        return new Response(JSON.stringify({ error: "Origin not allowed" }), {
            status: 403,
            headers: { "Content-Type": "application/json" },
        });
    }

    try {
        const { messages, layers, tools, sessionId } = await req.json();

        // 1. Persist user message if sessionId is provided
        if (sessionId) {
            try {
                const token = await getToken({ req: req as any, secret: process.env.NEXTAUTH_SECRET });
                if (token?.accessToken) {
                    const plain = decrypt(token.accessToken);
                    const baseURL = process.env.NEXT_AUTH_URL;

                    // Get only the most recent user message from current interaction
                    const lastMessage = messages[messages.length - 1];
                    if (lastMessage && lastMessage.role === "user") {
                        await fetch(`${baseURL}/chat/sessions/${sessionId}/messages`, {
                            method: "POST",
                            headers: {
                                Authorization: `Bearer ${plain}`,
                                Accept: "application/json",
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                                role: "user",
                                content: lastMessage.content
                            }),
                        });
                    }
                }
            } catch (persistErr) {
                console.error("Failed to persist user message server-side:", persistErr);
            }
        }

        messages?.forEach((m: any) => delete m.parts);

        const merged = messages;
        const prompt = createPrompt(merged.slice(-5));

        const result = streamText({
            // model: lmstudio("llama-3.1-8b-lexi-uncensored-v2"),
            // model: lmstudio("deepseek-r1-distill-llama-8b"),
            // model: lmstudio("meta-llama-3.1-8b-instruct"),
            // model: google("gemini-2.5-flash"),
            model: openrouter("google/gemini-2.5-flash"),
            system: systemPrompt,
            messages: merged.slice(-5),
            temperature: 0.8,
            maxSteps: 10,
            tools: callTools(tools, layers),
            maxTokens: 5000,
        });
        return result.toDataStreamResponse();
    } catch (error) {
        console.error("Error in chat API:", error);
        return new Response(
            JSON.stringify({ error: "Terjadi kesalahan saat memproses permintaan" }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            }
        );
    }
}
