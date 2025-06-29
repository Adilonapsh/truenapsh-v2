'use server'

import { getAuthSession } from "@/lib/auth-utils";
import { decrypt } from "@/lib/crypt";
import { getServerSession } from "next-auth";

type UserResponse = {
    message: string,
    data: User
}

export type User = {
    id: string,
    name: string,
    username: string,
    email: string,
    email_verified_at?: string | null,
    bio?: string | null,
    website?: string | null,
    created_at: string,
    updated_at: string,
    roles: string[],
}

type FormData = {
    name: string,
    email: string,
    password: string,
}

const baseURL = process.env.NEXT_AUTH_URL;

export const get = async (): Promise<User[]> => {
    const data = await fetch(`${baseURL}/users`);
    const json = await data.json();
    return json;
}

export const register = async (formData: FormData): Promise<User> => {
    const data = await fetch(`${baseURL}/auth/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    });

    if (!data.ok) {
        throw new Error(`HTTP error! status: ${data.status}`);
    }

    const json = await data.json();
    return json;
}

export const userDetails = async (): Promise<User> => {
    const session = await getAuthSession();
    if (!session?.user || !('accessToken' in session.user)) throw new Error('Unauthorized: Missing access token');
    const accessToken = decrypt(session.user.accessToken as string);
    const data = await fetch(`${baseURL}/auth/user`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
        },
    });

    if (!data.ok) {
        throw new Error(`HTTP error! status: ${data.status}`);
    }

    const json = await data.json();
    return json;
}

export const update = async (formData: any): Promise<User | undefined> => {
    const session = await getAuthSession();
    if (!session?.user || !('accessToken' in session.user)) throw new Error('Unauthorized: Missing access token');
    const accessToken = decrypt(session.user.accessToken as string);

    try {
        const data = await fetch(`${baseURL}/auth/update-profile`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
            },
            body: formData
        });
        const json = await data.json();
        return json;
    } catch (error: any) {
        if (error.response) {
            const errData = await error.response.json();
            console.log('Validation errors:', errData.errors);
        } else {
            console.log('Fetch failed:', error.message);
        }
    }


}