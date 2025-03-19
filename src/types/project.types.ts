import { Layer } from "./map.types";

type Project = {
    id?: string;
    name: string;
    description?: string;
    user_id?: string;
    thumbnail?: string;
    layers?: Layer[];
    tags?: string[] | string;
    share_options?: string;
    created_at?: string;
    updated_at?: string;
}


export type {
    Project
}