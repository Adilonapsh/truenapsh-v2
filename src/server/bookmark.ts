'use server'

import { getServerAuthSession } from "@/lib/auth";
import { decrypt } from "@/lib/crypt";
import { Bookmark, BookmarkResponse } from "@/types/bookmark.types";

const baseURL = process.env.NEXT_AUTH_URL;

export const bookmark = async (project_id: string): Promise<BookmarkResponse> => {
    const session = await getServerAuthSession();
    
    // Check if session and user exist
    if (!session?.user?.accessToken) {
        throw new Error('Unauthorized: No valid session found');
    }
    
    const accessToken = decrypt(session.user.accessToken);

    const data = await fetch(`${baseURL}/bookmark?project_id=${project_id}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
        }
    });

    if (!data.ok) {
        throw new Error(`Failed to fetch bookmarks: ${data.statusText}`);
    }

    const json = await data.json();
    return json;
}

export const addBookmark = async (properties: Bookmark): Promise<BookmarkResponse> => {
    const session = await getServerAuthSession();
    
    // Check if session and user exist
    if (!session?.user?.accessToken) {
        throw new Error('Unauthorized: No valid session found');
    }
    
    const accessToken = decrypt(session.user.accessToken);

    const data = await fetch(`${baseURL}/bookmark`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(properties)
    })

    if (!data.ok) {
        throw new Error(`Failed to add bookmark: ${data.statusText}`);
    }

    const json = await data.json();
    return json;
}

export const updateBookmark = async (bookmark_id: string, properties: Bookmark): Promise<BookmarkResponse> => {
    const session = await getServerAuthSession();
    
    // Check if session and user exist
    if (!session?.user?.accessToken) {
        throw new Error('Unauthorized: No valid session found');
    }
    
    const accessToken = decrypt(session.user.accessToken);

    const data = await fetch(`${baseURL}/bookmark/${bookmark_id}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(properties)
    });
    
    if (!data.ok) {
        throw new Error(`Failed to update bookmark: ${data.statusText}`);
    }

    const json = await data.json();
    return json;
}

export const removeBookmark = async (bookmark_id: string): Promise<BookmarkResponse> => {
    const session = await getServerAuthSession();
    
    // Check if session and user exist
    if (!session?.user?.accessToken) {
        throw new Error('Unauthorized: No valid session found');
    }
    
    const accessToken = decrypt(session.user.accessToken);

    const data = await fetch(`${baseURL}/bookmark/${bookmark_id}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        }
    })
    
    if (!data.ok) {
        throw new Error(`Failed to remove bookmark: ${data.statusText}`);
    }

    const json = await data.json();
    return json;
}