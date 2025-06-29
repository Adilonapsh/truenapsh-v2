'use server'


import { getAuthSession } from "@/lib/auth-utils";
import { decrypt } from "@/lib/crypt";
import { Bookmark, BookmarkResponse } from "@/types/bookmark.types";

const baseURL = process.env.NEXT_AUTH_URL;

export const bookmark = async (project_id: string): Promise<BookmarkResponse> => {
    const session = await getAuthSession();
    if (!session?.user || !('accessToken' in session.user)) throw new Error('Unauthorized: Missing access token');
    const accessToken = decrypt(session.user.accessToken as string);

    const data = await fetch(`${baseURL}/bookmark?project_id=${project_id}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
        }
    });

    const json = await data.json();
    return json;
}

export const addBookmark = async (properties: Bookmark): Promise<BookmarkResponse> => {
    const session = await getAuthSession();
    if (!session?.user || !('accessToken' in session.user)) throw new Error('Unauthorized: Missing access token');
    const accessToken = decrypt(session.user.accessToken as string);

    const data = await fetch(`${baseURL}/bookmark`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(properties)
    })

    const json = await data.json();
    return json;
}

export const updateBookmark = async (bookmark_id: string, properties: Bookmark): Promise<BookmarkResponse> => {
    const session = await getAuthSession();
    if (!session?.user || !('accessToken' in session.user)) throw new Error('Unauthorized: Missing access token');
    const accessToken = decrypt(session.user.accessToken as string);

    const data = await fetch(`${baseURL}/bookmark/${bookmark_id}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(properties)
    });
    const json = await data.json();
    return json;
}

export const removeBookmark = async (bookmark_id: string): Promise<BookmarkResponse> => {
    const session = await getAuthSession();
    if (!session?.user || !('accessToken' in session.user)) throw new Error('Unauthorized: Missing access token');
    const accessToken = decrypt(session.user.accessToken as string);

    const data = await fetch(`${baseURL}/bookmark/${bookmark_id}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        }
    })
    const json = await data.json();

    return json;
}
