import { streamText, tool } from "ai";
import { google, lmstudio } from "@/lib/lmstudio";
import { createPrompt } from "@/lib/promptTemplate";
import { z } from 'zod';
import { filterLayerAttributes } from "@/tools/ai-tools/ai-tools";
import { Layer } from "@/types/map.types";
import { encode as ToonEncode } from '@toon-format/toon';

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
        const { messages, layers } = await req.json();

        const prompt = createPrompt(messages);

        const result = streamText({
            model: google("gemini-2.0-flash"),
            messages: [{ role: "user", content: prompt }],
            temperature: 0.8,
            maxSteps: 5,
            tools: {
                get_layers: tool({
                    description: "Get the list of available layers from the system",
                    parameters: z.object({
                        layerType: z.string().default("all").nullable().describe("Type of layers to retrieve"),
                    }),
                    execute: async ({ layerType }) => {
                        const filteredLayers = filterLayerAttributes(layers, [
                            "id",
                            "name",
                            "description",
                            "map_service_url",
                            "map_service_layer_name",
                            "map_service_vendor",
                            "metadata.version",
                            "render_type",
                            "created_at",
                        ]);
                        // return { layers: filteredLayers };
                        return ToonEncode({ layers: filteredLayers });
                    },
                }),
                get_properties_of_layer: tool({
                    description: "Get the fields of a specific layer",
                    parameters: z.object({
                        layerId: z.string().describe("ID of the layer to retrieve fields for"),
                    }),
                    execute: async ({ layerId }) => {
                        const layer = layers.find((l: Layer) => l.id === layerId);
                        if (!layer) {
                            return { error: `Layer with ID ${layerId} not found` };
                        }
                        // return { properties: layer.fields };
                        return ToonEncode({ properties: layer.fields });
                    },
                }),
                get_time: tool({
                    description: "Get the current time",
                    parameters: z.object({}),
                    execute: async () => {
                        return ToonEncode({ time: new Date().toISOString() });
                    },
                }),
            },
            maxTokens: 1000, // Consider adding this
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
