import { getServerAuthSession } from "@/lib/auth";
import { decrypt } from "@/lib/crypt";
import { Datasets } from "@/types/datasets.types";

const baseURL = process.env.NEXT_AUTH_URL;

export const get = async (): Promise<Datasets[]> => {
  const session = await getServerAuthSession();

  // Check if session and user exist
  if (!session?.user?.accessToken) {
    throw new Error("Unauthorized: No valid session found");
  }

  const accessToken = decrypt(session.user.accessToken);

  const data = await fetch(`${baseURL}/datasets`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      accept: "application/json",
    },
  });

  const json = await data.json();
  return json.data;
};
