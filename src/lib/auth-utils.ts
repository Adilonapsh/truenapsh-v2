import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export const getAuthSession = async () => {
    const session = await getServerSession(authOptions);
    return session;
};

export const requireAuth = async () => {
    const session = await getServerSession(authOptions);
    if (!session) {
        redirect("/auth/login");
    }
    return session;
};

export const getCurrentUser = async () => {
    const session = await getServerSession(authOptions);
    return session?.user || null;
};