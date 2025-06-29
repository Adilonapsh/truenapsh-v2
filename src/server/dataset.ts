import { getAuthSession } from "@/lib/auth-utils";
import { decrypt } from "@/lib/crypt";
import { Datasets } from "@/types/datasets.types";

const baseURL = process.env.NEXT_AUTH_URL;

type DatasetResponse = {
    data: Datasets[]
}

export const get = async (): Promise<DatasetResponse> => {
    const session = await getAuthSession();
    if (!session?.user || !('accessToken' in session.user)) throw new Error('Unauthorized: Missing access token');
    const accessToken = decrypt(session.user.accessToken as string);

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