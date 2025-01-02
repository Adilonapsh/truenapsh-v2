'use server'

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { decrypt } from "@/lib/crypt";
import { Project } from "@/types/project.types";
import { getServerSession } from "next-auth";

const baseURL = process.env.NEXT_AUTH_URL;


export const get = async (): Promise<Project[]> => {
    const session = await getServerSession(authOptions);
    const accessToken = decrypt(session?.user.accessToken);

    const data = await fetch(`${baseURL}/projects`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
    });

    const json = await data.json();
    return json;
}

export const project = async (id: string): Promise<Project> => {
    const session = await getServerSession(authOptions);
    const accessToken = decrypt(session?.user.accessToken);
    const data = await fetch(`${baseURL}/projects/${id}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
    });

    const json = await data.json();
    return json.data;
}