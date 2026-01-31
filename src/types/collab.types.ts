// WebSocket event types for real-time collaboration
export type CollabEventType =
    | 'LAYER_ADD'
    | 'LAYER_UPDATE'
    | 'LAYER_DELETE'
    | 'LAYER_REORDER'
    | 'LAYER_VISIBILITY'
    | 'FOLDER_ADD'
    | 'FOLDER_RENAME'
    | 'FOLDER_DELETE'
    | 'FOLDER_VISIBILITY';

export interface CollabEvent {
    type: CollabEventType;
    projectId: string;
    userId: string;
    payload: any;
}

// Specific event payloads
export interface LayerAddEvent {
    layer: any; // Layer type
}

export interface LayerUpdateEvent {
    layerId: string;
    updates: Partial<any>; // Partial<Layer>
}

export interface LayerDeleteEvent {
    layerId: string;
}

export interface LayerReorderEvent {
    parentId: string; // folder path or 'root'
    order: string[];
}

export interface LayerVisibilityEvent {
    layerId: string;
    visible: boolean;
}

export interface FolderAddEvent {
    path: string;
}

export interface FolderRenameEvent {
    oldPath: string;
    newPath: string;
}

export interface FolderDeleteEvent {
    path: string;
}

export interface FolderVisibilityEvent {
    path: string;
    visible: boolean;
}
