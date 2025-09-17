"use server";

import { getServerAuthSession } from "@/lib/auth";
import { decrypt } from "@/lib/crypt";
import { Project } from "@/types/project.types";

const baseURL = process.env.NEXT_AUTH_URL;

export const get = async (): Promise<Project[]> => {
  const session = await getServerAuthSession();

  // Check if session and user exist
  if (!session?.user?.accessToken) {
    throw new Error("Unauthorized: No valid session found");
  }

  const accessToken = decrypt(session.user.accessToken);

  const data = await fetch(`${baseURL}/projects`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      accept: "application/json",
    },
  });

  const json = await data.json();
  return json.data;
};

export const project = async (id: string): Promise<Project> => {
  const session = await getServerAuthSession();

  // Check if session and user exist
  if (!session?.user?.accessToken) {
    throw new Error("Unauthorized: No valid session found");
  }

  const accessToken = decrypt(session.user.accessToken);

  const data = await fetch(`${baseURL}/projects/${id}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      accept: "application/json",
    },
  });

  const json = await data.json();
  return json.data;
};

export const create = async (project: Project): Promise<Project> => {
  const session = await getServerAuthSession();

  // Check if session and user exist
  if (!session?.user?.accessToken) {
    throw new Error("Unauthorized: No valid session found");
  }

  const accessToken = decrypt(session.user.accessToken);
  try {
    const data = await fetch(`${baseURL}/projects`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(project),
    });
    const json = await data.json();
    return json;
  } catch (error) {
    throw new Error(
      `Failed to create project: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};
