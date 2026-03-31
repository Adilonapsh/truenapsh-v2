import { v4 as uuidv4 } from "uuid";

class GeoWorkerPool {
    private worker: Worker | null = null;
    private callbacks: Map<string, { resolve: (val: any) => void; reject: (err: any) => void }> = new Map();

    constructor() {
        if (typeof window !== "undefined") {
            try {
                // Use Vite's worker loading syntax
                this.worker = new Worker(new URL("../workers/geo.worker.ts", import.meta.url), {
                    type: "module",
                });

                this.worker.onmessage = (e) => {
                    const { id, result, error } = e.data;
                    const callback = this.callbacks.get(id);
                    if (callback) {
                        if (error) {
                            callback.reject(new Error(error));
                        } else {
                            callback.resolve(result);
                        }
                        this.callbacks.delete(id);
                    }
                };

                this.worker.onerror = (e) => {
                    console.error("GeoWorkerPool error:", e);
                };
            } catch (error) {
                console.error("Failed to initialize GeoWorkerPool:", error);
            }
        }
    }

    async execute(type: string, payload: any): Promise<any> {
        if (!this.worker) {
            // Fallback for SSR or initialization failure (though we aim for worker)
            console.warn("GeoWorkerPool not initialized, operation might fail or block");
            throw new Error("Worker not initialized");
        }

        const id = uuidv4();
        return new Promise((resolve, reject) => {
            this.callbacks.set(id, { resolve, reject });
            this.worker?.postMessage({ type, payload, id });
        });
    }
}

export const geoWorkerPool = new GeoWorkerPool();
