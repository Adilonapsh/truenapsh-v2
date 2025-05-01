import { LngLat } from "mapbox-gl"

export interface BookmarkResponse {
    data: Bookmark[]
}

export interface Bookmark {
    id: string
    name: string
    project_id?: string
    user_id?: string
    properties?: Record<string, object | string | number | undefined | LngLat>
    created_at?: string
    updated_at?: string
}