'use server'

interface User {
    id: string,
    email: string,
    name: string,
    username: string,
    email_verified_at?: string | null,
    created_at?: string,
    updated_at?: string,
}

type FormData = {
    name: string,
    email: string,
    password: string,
}

const baseURL = process.env.APP_URL;

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
        body: JSON.stringify({ formData })
    });
    const json = await data.json();
    return json;
}