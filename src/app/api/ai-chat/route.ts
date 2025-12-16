import { streamText, tool } from "ai";
import { google, lmstudio } from "@/lib/lmstudio";
import { createPrompt } from "@/lib/promptTemplate";
import { z } from 'zod';
import { filterLayerAttributes } from "@/tools/ai-tools/ai-tools";
import { Layer } from "@/types/map.types";
import { encode as ToonEncode } from '@toon-format/toon';
import { weatherIntegration } from "@/services/map-integrations";
import { systemPrompt } from "@/lib/systemPrompt";

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
        const { messages, layers, history } = await req.json();

        const merged = Array.isArray(history) ? [...history, ...messages] : messages;
        const prompt = createPrompt(merged.slice(-5));

        const result = streamText({
            // model: lmstudio("llama-3.1-8b-lexi-uncensored-v2"),
            // model: lmstudio("deepseek-r1-distill-llama-8b"),
            // model: lmstudio("meta-llama-3.1-8b-instruct"),
            model: google("gemini-2.5-flash"),
            system: systemPrompt,
            messages: merged.slice(-5),
            temperature: 0.8,
            maxSteps: 10,
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
                        return ToonEncode({ layers: filteredLayers });
                    },
                }),
                get_layer_properties: tool({
                    description: "Get the fields of a specific layer",
                    parameters: z.object({
                        layerId: z.string().describe("ID of the layer to retrieve fields for"),
                    }),
                    execute: async ({ layerId }) => {
                        const layer = layers.find((l: Layer) => l.id === layerId);
                        if (!layer) {
                            return { error: `Layer with ID ${layerId} not found` };
                        }
                        return ToonEncode({ properties: layer.fields });
                    },
                }),
                get_time: tool({
                    description: "Get the current time",
                    parameters: z.object({
                        timezone: z.string().default("Asia/Jakarta").nullable().describe("Timezone of the location"),
                    }),
                    execute: async ({ timezone }) => {
                        return ToonEncode({ time: new Date().toLocaleString("en-US", { timeZone: timezone || "Asia/Jakarta" }) });
                    },
                }),
                get_weather: tool({
                    description: "Get the weather forecast for a specific location",
                    parameters: z.object({
                        source: z.string().default("bmkg").nullable().describe("Source of the weather data (bmkg or open-meteo)"),
                        lon: z.number().describe("Longitude of the location"),
                        lat: z.number().describe("Latitude of the location"),
                    }),
                    execute: async ({ source, lon, lat }) => {
                        const weatherData = await weatherIntegration(lon, lat, source || undefined);
                        return ToonEncode({ weather: weatherData.weather.data });
                    },
                }),
            },
            maxTokens: 2000,
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
