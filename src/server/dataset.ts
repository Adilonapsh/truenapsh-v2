import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { decrypt } from "@/lib/crypt";
import { Datasets } from "@/types/datasets.types";
import { getServerSession } from "next-auth";

const baseURL = process.env.NEXT_AUTH_URL;

export const get = async (): Promise<Datasets[]> => {
    const session = await getServerSession(authOptions);
    const accessToken = decrypt(session?.user.accessToken);

    const data = await fetch(`${baseURL}/datasets`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'accept': 'application/json',
        },
    });

    const json = await data.json();
    return json;
}