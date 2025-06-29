'use server'

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { decrypt } from "@/lib/crypt";
import { Bookmark, BookmarkResponse } from "@/types/bookmark.types";
import { getServerSession } from "next-auth";

const baseURL = process.env.NEXT_AUTH_URL;

export const bookmark = async (project_id: string): Promise<BookmarkResponse> => {
    const session = await getServerSession(authOptions);
    const accessToken = decrypt(session?.user.accessToken);

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
    const session = await getServerSession(authOptions);
    const accessToken = decrypt(session?.user.accessToken);

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
    const session = await getServerSession(authOptions);
    const accessToken = decrypt(session?.user.accessToken);

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
    const session = await getServerSession(authOptions);
    const accessToken = decrypt(session?.user.accessToken);

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
