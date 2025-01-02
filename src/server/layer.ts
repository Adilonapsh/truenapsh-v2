'use server'

import { Layer } from "@/types/map.types";

const baseURL = process.env.APP_URL;

export const get = async (): Promise<Layer[]> => {
    const data = await fetch(`${baseURL}/layers`);
    const json = await data.json();
    return json;
}