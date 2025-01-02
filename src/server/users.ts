'use server'

interface User {
    email: string,
    id: string
}

const baseURL = process.env.APP_URL;

export const get = async (): Promise<User[]> => {
    const data = await fetch(`${baseURL}/users`);
    const json = await data.json();
    return json;
}